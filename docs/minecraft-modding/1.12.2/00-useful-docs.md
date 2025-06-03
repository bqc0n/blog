---
title: "Minecraft Modding (1.12.2) #0 - 参考になるサイト"
order: 0
---

# Minecraft Modding 1.12.2 参考になるサイト

思い出し次第追記する。

## TL;DR

- [Forge Documentation](https://docs.minecraftforge.net/en/1.12.x/) (英語)
- [Minecraft Modding Wiki](https://mcmodding.jp/modding/index.php/%E3%83%81%E3%83%A5%E3%83%BC%E3%83%88%E3%83%AA%E3%82%A2%E3%83%AB%E4%B8%80%E8%A6%A7) (日本語)
- [TNT Modders | Mod開発講座](https://www.tntmodders.com/tutorial/) (日本語)
- [Modding修正講座](https://www.nicovideo.jp/user/1791635/series/104078) (日本語動画)
- [MinecraftByExample](https://github.com/TheGreyGhost/MinecraftByExample/tree/1-12-2-final) (英語)
- [TheGreyGhost's Minecraft Modding Blog](https://greyminecraftcoder.blogspot.com) (英語)
- [Shadowfacts' Modding Tutorial](https://shadowfacts.net/tutorials/forge-modding-112/overview/) (英語)

日本語だけだと情報が少ないので、英語でも検索することをオススメする。

## 本編

### [Forge Documentation](https://docs.minecraftforge.net/en/1.12.x/) (英語)

公式ドキュメント。[BlockState](https://docs.minecraftforge.net/en/1.12.x/blocks/states/) [まわりの話](https://docs.minecraftforge.net/en/1.12.x/models/blockstates/introduction/)が詳しく書かれていたり、[こう言う罠](https://docs.minecraftforge.net/en/1.12.x/tileentities/tileentity/#keeping-a-tileentity-through-changing-blockstates)についても書かれていたりするので、一度通して読んでおくといいと思う。

### [Minecraft Modding Wiki](https://mcmodding.jp/modding/index.php/%E3%83%81%E3%83%A5%E3%83%BC%E3%83%88%E3%83%AA%E3%82%A2%E3%83%AB%E4%B8%80%E8%A6%A7) (日本語)

SSIA。1.8の内容がそのまま1.12.2でも使えたりするので、自分が使っているバージョンだけでなく、その周辺も見るといいと思う。

### [Modding修正講座](https://www.nicovideo.jp/user/1791635/series/104078) (日本語動画)

HaC作者による、不具合を修正する形の解説動画シリーズ。デバッグの基本や、`@SideOnly`など クライアント/サーバーの分離などについて学べる。

### [TNT Modders | Mod開発講座](https://www.tntmodders.com/tutorial/) (日本語)

[匠Craft](https://www.tntmodders.com/takumicraft/)の作者によるMod開発講座。

### [MinecraftByExample](https://github.com/TheGreyGhost/MinecraftByExample) (英語)

1.12.2のブランチは[ここ](https://github.com/TheGreyGhost/MinecraftByExample/tree/1-12-2-final)。
`IBakedModel`([MBE04](https://github.com/TheGreyGhost/MinecraftByExample/tree/1-12-2-final/src/main/java/minecraftbyexample/mbe04_block_dynamic_block_model1))や`TileEntitySpecialRenderer`([MBE21](https://github.com/TheGreyGhost/MinecraftByExample/tree/1-12-2-final/src/main/java/minecraftbyexample/mbe21_tileentityspecialrenderer))、パーティクル([MBE50](https://github.com/TheGreyGhost/MinecraftByExample/tree/master/src/main/java/minecraftbyexample/mbe50_particle))などレンダリング関係の話が豊富だが、それに限らない。RedstoneやGUI、ネットワークの話もある。

### [TheGreyGhost's Minecraft Modding Blog](https://greyminecraftcoder.blogspot.com) (英語)

MinecraftByExampleの作者によるブログ。

### [Shadowfacts' Modding Tutorial](https://shadowfacts.net/tutorials/forge-modding-112/overview/) (英語)

[Shadowfacts' Forgelin](https://www.curseforge.com/minecraft/mc-mods/shadowfacts-forgelin)の作者による、1.12向けのMinecraft Modding チュートリアル。

