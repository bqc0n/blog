---
title: "Minecraft Modding (1.12.2) #1 - IBakedModel"
order: 1
---

# Minecraft Modding (1.12.2) #1 - IBakedModel

## はじめに

`IBakedModel`とか`TileEntitySpecialRenderer`などに関する解説記事があんまりないなーと思ったので、書いてみる。
アイテム/ブロックの追加などの基本的な部分については扱わない。素晴らしい記事がインターネット上にたくさんあるので、そちらを参照して欲しい。
環境構築は少しだけ扱う。

なお、サンプルコードは人口が多いであろうJavaで書くが、個人的には、スマートキャストやエルビス演算子などの便利な機能があるKotlinをお勧めする。

### 環境構築Tips

今から1.12.2でModdingをする場合、CleanroomMCの[TemplateDevEnv](https://github.com/CleanroomMC/TemplateDevEnv)を使うと簡単に環境を構築できる。
ちなみに[Kotlin用](https://github.com/CleanroomMC/TemplateDevEnvKt)もある。
[GregTechCEu/Buildscripts](https://github.com/GregTechCEu/Buildscripts)も参考になると思う。

## `IBakedModel`とはなに?

TESRと同じようにDynamicなRenderingを行うものである。
TESRが"active"にTileEntityを描画するのに対し、`IBakedModel`は"passive"である。
つまり、TESRの`render`メソッドは常に呼ばれ続けるが、`IBakedModel`の`getQuads`メソッドは、周りのブロックが変更された時などにのみ呼ばれる。

それと、クラス間の依存関係が多めで把握しづらい。せっかくなので以下にまとめてみた。

```d2
ICustomModelLoader: {
  shape: class
}


IModel: {
  shape: class
}

IBakedModel: {
  shape: class
}

IExtendedBlockState: {
  shape: class
}

Block: {
  shape: class
}

ICustomModelLoader -> IModel
IModel -> IBakedModel
IBakedModel -> IExtendedBlockState
Block -> IExtendedBlockState
```

## 作ってみる

```java [ExampleModel.java]
public class ExampleModel implements IModel {
    @Override
    public IBakedModel bake(IModelState state, VertexFormat format, Function<ResourceLocation, TextureAtlasSprite> bakedTextureGetter) {
        return new ExampleBakedModel(ModelLoaderRegistry.getMissingModel().bake(state, format, bakedTextureGetter));
    }
}
```

```java [ClientProxy]
public void preInit(FMLPreInitializationEvent e) {
    ModelLoaderRegistry.registerLoader(new ExampleModelLoader());
}
```