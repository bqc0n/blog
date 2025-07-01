---
title: "Minecraft ModをMaven Centralに公開する時の罠"
date: 2025-06-12
tags: [ "minecraft", "coding" ]
---

[`Im-Fran/SonatypeCentralUpload`](https://github.com/Im-Fran/SonatypeCentralUpload)を利用して、Minecraft ModをMaven Centralに公開するときに遭遇した罠について書く。

公開の具体的な手順については[この記事様](https://zenn.dev/orangain/articles/publish-to-maven-central-using-gradle)を参考にしてほしい。

## 環境

- Minecraft 1.12.2
- Minecraft Forge 14.23.5.2847
- RetroFuturaGradle 1.3.27

## versionが`unspecified`になる。

例えば
```
* What went wrong:
Execution failed for task ':sonatypeCentralUpload'.
> Artifact name 'mctest-dev.jar' does not match or does not start with project name 'mctest-unspecified'.
```
のように、バージョンの部分が`unspecified`になってしまう問題。

これはSonatypeCentralUpload pluginが`project.version`からバージョンを取得しているためである。
例えばCleanroomMCのTemplateDevEnvの場合、バージョンが格納されている変数は`mod_version`であるため、このようなエラーとなってしまう。

`project.version`を指定すれば解決できる。

```kotlin [build.gradle.kts]
project.version = mod_version
```


## `File path '**' is not valid for file '**'`

`version`と同じく、グループIDも`project.group`から取得される。
```kotlin [build.gradle.kts]
project.group = maven_group
```

## 無印の`.jar`がなく、`{-dev,-javadoc,-sources}.jar`しかない

タスク`jar`が生成するのは、`-dev.jar`である。
これはjarファイルをModとして使用するには再度難読化を行わないといけないためである。
それを行うタスクは`reobfJar`なので、これを指定すると無印のjarファイルを生成してくれる。

```kotlin [build.gradle.kts]
tasks.named<SonatypeCentralUploadTask>("sonatypeCentralUpload") {
    dependsOn("jar", "reobfJar", "sourcesJar", "javadocJar", "generatePomFileForMavenPublication")
    // ...
    
    archives.set(files(
        tasks.named("jar"),
        tasks.named("reobfJar"), // [!code ++]
        tasks.named("sourcesJar"),
        tasks.named("javadocJar"),
    ))
}
```

::: info
bruh
:::