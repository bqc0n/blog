---
title: Raspberry PiをSwitchBot Hub代わりにして防水温湿度計からデータを取得する
date: 2025-02-08
description: Raspberry PiをHub代わりにして、PythonでW3400010からBLEでデータを取得するまで
tags: ["Raspberry Pi", "coding"]
---

---
余ったラズパイがあったので、SwitchBot Hubを使わず、Raspberry PiからSwitchBot 防水温湿度計の温度・湿度・バッテリー残量を取得する。

[[toc]]

## 使ったもの

- Raspberry Pi 3 Model B V1.2
- SwitchBot 防水温湿度計 (W3400010)

## bleakのインストール

今回はPythonからBluetooth Low Energyを利用するために[bleak](https://github.com/hbldh/bleak)を利用する。
pipでインストールする。

```shell
python3 -m venv venv
. venv/bin/activate
python3 -m pip install bleak
```

## とりえあずデータを取得してみる

以下のコードを適当に実行してみる

```python
#!./venv/bin/python

import asyncio

import bleak.backends.device
from bleak import BleakScanner

MAC = "<防水温湿度計のMACアドレス>"
COMPANY_ID = 0x0969

async def main():
    stop_event = asyncio.Event()
    def callback(device: bleak.backends.device.BLEDevice, advertising_data: bleak.backends.scanner.AdvertisementData):
        if device.address == MAC:
            svc = advertising_data.service_data
            if len(svc) == 0:
                return
            data_bytes: bytes = advertising_data.manufacturer_data[COMPANY_ID]
            print(f"Advertising data: {advertising_data}")
            print(f"Data: {data_bytes.hex()}")
            print(f"Service: {svc['0000fd3d-0000-1000-8000-00805f9b34fb'].hex()}")
            stop_event.set()

    async with BleakScanner(callback) as scanner:
        await stop_event.wait()

if __name__ == "__main__":
    asyncio.run(main())
```

実行結果。`XXXXXXXXXXXX`は防水温湿度計のMACアドレス、`090201971f00`がデータ。
pythonのbytesをそのまま`print`すると、ASCIIで表現できるものはASCIIで表現されるようで、@やwなどがそれ。

```
Advertising data: AdvertisementData(manufacturer_data={2409: b'<DATA>'}, service_data={'0000fd3d-0000-1000-8000-00805f9b34fb': b'w\x00`'}, rssi=-48)
Data: XXXXXXXXXXXX090201971f00
Service: 770060
```

## データ解析

このデータから、SwitchBot Appで見た値と一致する部分を探し出す。
この時、温度は23.1℃、湿度は31%、バッテリー残量は96%だった。

まずはDataの方を見てみる。
0-5 indexはMACアドレスなのでそのあとを表に整理する。

| index  | 6        | 7        | 8        | 9        | 10       | 11       |
|:------:|----------|----------|----------|----------|----------|----------|
|  hex   | 09       | 02       | 01       | 97       | 1f       | 00       |
| binary | 00001001 | 00000010 | 00000001 | 10010111 | 00011111 | 00000000 |

まずわかりやすいのはindex 10の部分で、値は31。おそらくこの位置が湿度。

そして、[Broadcast Message Format](https://github.com/OpenWonderLabs/SwitchBotAPI-BLE/blob/latest/devicetypes/meter.md#meter-broadcast-message-format)をみると、湿度の1つ前のバイトは温度のようである。
MSBは温度が+か-かのフラグで、1が+で0が-である。
それに沿ってindex 9の部分を見ると、`0b10010111 = +23`なので、おそらくこの位置が温度の整数部分。
さらにその前の4bitが少数部分で、`0b0001 * 0.1 = 0.1`。
足して23.1℃。

他にバッテリー残量を表していそうなところはないので、次にService Dataを見てみる。
index 2の場所が`0x60 = 96`なのでおそらくここがバッテリー残量。

## テスト

これまでの情報をもとに、温度・湿度・バッテリー残量を取得するコードを書いてみる。

```python
#!./venv/bin/python

import asyncio

import bleak.backends.device
from bleak import BleakScanner

MAC = "XX:XX:XX:XX:XX:XX"
COMPANY_ID = 0x0969

async def main():
    stop_event = asyncio.Event()
    def callback(device: bleak.backends.device.BLEDevice, advertising_data: bleak.backends.scanner.AdvertisementData):
        if device.address == MAC:
            svc = advertising_data.service_data
            if len(svc) == 0:
                return
            data_bytes: bytes = advertising_data.manufacturer_data[COMPANY_ID]
            temp_raw = ((data_bytes[8] & 0b00001111) * 0.1 + (data_bytes[9] & 0b01111111))
            pn_flag = (data_bytes[9] & 0b10000000)
            temperature = temp_raw if pn_flag else -temp_raw
            humidity = data_bytes[10] & 0b01111111
            battery_pct = (svc['0000fd3d-0000-1000-8000-00805f9b34fb'][2] & 0b01111111 )
            print(f"Temperature: {temperature}°C, Humidity: {humidity}%, Battery: {battery_pct}%")
            stop_event.set()

    async with BleakScanner(callback) as scanner:
        await stop_event.wait()

if __name__ == "__main__":
    asyncio.run(main())
```

バイト列からデータを取得する部分はこの辺り。

```python
temp_raw = ((data_bytes[8] & 0b00001111) * 0.1 + (data_bytes[9] & 0b01111111))
pn_flag = (data_bytes[9] & 0b10000000)
temperature = temp_raw if pn_flag else -temp_raw
humidity = data_bytes[10] & 0b01111111
```

実行結果はこんな感じになる。同じタイミングで実行すれば、SwitchBot Appで見れる値と一致するはず。

```
Temperature: 23.0°C, Humidity: 32%, Battery: 96%
```

これで、防水温湿度計のデータをRaspberry Piから取得できるようになった。