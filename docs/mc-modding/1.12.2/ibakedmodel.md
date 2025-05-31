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

TESRと同じようにDynamicなRenderingを行うためのものなのだが、使う準備と関連するクラスが多い。

```d2
ICustomModelLoader: {
  shape: class

  onResourceManagerReload(IResourceManager resourceManager)
  accepts(ResourceLocation modelLocation): boolean
  loadModel(ResourceLocation modelLocation): IModel
}


IModel: {
  shape: class
  
  getTextures(): Set\<ResourceLocation\>
  bake(\.\.\.): IBakedModel
}

IBakedModel: {
  shape: class
  
  getQuads(IBlockState state, EnumFacing side, long rand): List\<BakedQuad\>
  isAmbientOcclusion(): boolean
  isGui3d(): boolean
  getParticleTexture(): TextureAtlasSprite
  getItemCameraTransforms(): ItemCameraTransforms
  getOverrides(): ItemOverrideList
}

ICustomModelLoader -> IModel -> IBakedModel
```