---
title: "Minecraft 1.12.2にGame Testsを移植したい #1 - Method収集とStructureBlockの召喚"
date: 2025-06-5
description: "@GameTestが付けられたメソッドを収集して、StructureBlockを召喚するまで。"
tags: [ "minecraft", "coding" ]
---

## シリーズ

- [Minecraft 1.12.2にGame Testsを移植したい - #0 構想編](../0604-mctest-0)
- [Minecraft 1.12.2にGame Testsを移植したい #1 - Method収集とStructureBlockの召喚](../0605-mctest-1)
- [Minecraft 1.12.2にGame Testsを移植したい #2 - テストの実行](../0608-mctest-2)

## 環境整備

Gradle Plugin化とかはよく分からないので後回しにして、ひとまずModとして実装していく。

CleanroomMCの[TemplateDevEnv](https://github.com/CleanroomMC/TemplateDevEnvKt)を[Cloneして](https://github.com/bqc0n/mctest)IDEで開いたら、環境整備は終わりである。

## Annotationの作成

`@GameTestHolder`と`@GameTest`、2つのAnnotationを作成する。

`@GameTestHolder`はクラスに付加するもので、Testやstructureのデフォルト名前空間を保持する。

```kotlin
@Target(AnnotationTarget.CLASS)
annotation class GameTestHolder(
    @get:JvmName("value")
    val namespace: String,
)
```

`@get:JvmName("value")`はJavaでも引数名を指定せずに利用できるよう付加してある。
Kotlinの場合、引数名が`value`以外でも名前を指定せずにAnnotationを使えるのだが、Javaの場合は名前付き引数の形をとる必要がある。

続いて`@GameTest`を作成。メソッドに付加するもので、テストの定義に関する情報を保持する。

```kotlin
@Target(AnnotationTarget.FUNCTION)
annotation class GameTest(
    val template: String = "",
    val timeoutTicks: Int = 100,
    val setupTicks: Int = 0,
)
```

今のうちに、`IGameTestHelper`も定義だけしておく。

```kotlin
interface IGameTestHelper
```

## MetaProgrammingのコーナー

準備は整った。Annotationがついたメソッドを収集してみよう。

今回はJEIの方法を真似て、`FMLPreInitializationEvent.asmData`を使う。

```kotlin
@Mod.EventHandler
fun preInit(e: FMLPreInitializationEvent) {
    val asmDataTable = e.asmData
    GameTestCollector.collectGameTests(asmDataTable)
}
```

```kotlin
object GameTestCollector {
    fun collectGameTests(asmDataTable: ASMDataTable) {}
}
```

メソッドの中身を書いていく。

ASMを使うと、なんとこれだけで`@GameTestHolder`が付けられたクラスのメソッドを収集できる。

```kotlin
val asmDataSet: Set<ASMDataTable.ASMData> = asmDataTable.getAll(GameTestHolder::class.java.canonicalName)
```

あとはこれをforで回して、動いているか確かめてみよう。

```kotlin
for (asmData in asmDataSet) {
    val clazz: Class<*> = Class.forName(asmData.className)
    println("Found GameTestHolder: ${clazz.name}")
}
```

適当なテストクラスを用意する。

```kotlin
@GameTestHolder(Tags.MOD_ID)
class Tests {
    @GameTest
    fun testExample(helper: IGameTestHelper) {
        // Example test method
        println("Running example test")
    }
}
```

動いた。

```
[22:45:13] [Client thread/INFO] [STDOUT]: [com.bqc0n.mctest.internal.GameTestCollector:collectGameTests:18]: Found GameTestHolder: com.bqc0n.mctest.tests.Tests
```

### GameTestDefinition

テストに関するステートレス(worldやposなど、実行時のコンテキストに依存しない)情報を保持しておく、`GameTestDefinition`を作成する。

```kotlin
data class GameTestDefinition(
    val testName: String,
    val templateStructure: ResourceLocation,
    val setupTicks: Int,
    val timeoutTicks: Int,
    val function: Consumer<IGameTestHelper>,
)
```

`collectGameTests`の目標は、これを製造することである。

加えて、`GameTestDefinition`を保存しておく`GameTestRegistry`を作成しておこう。

```kotlin
object GameTestRegistry {
    private val _tests = mutableMapOf<String, GameTestDefinition>()

    fun register(definition: GameTestDefinition) {
        val name = definition.testName
        if (_tests.containsKey(name)) {
            throw IllegalArgumentException("Game test '$name' is already registered.")
        }
        _tests[name] = definition
    }

    fun getAllTests(): ImmutableMap<String, GameTestDefinition> {
        return ImmutableMap.copyOf(_tests)
    }

    fun getTest(name: String): GameTestDefinition? {
        return _tests[name]
    }
}
```

## 収集したメソッドからGameTestDefinitionを作成

ここまで来たら、後はClassからメソッドを取得して、得られた情報達から`GameTestDefinition`を作成、`GameTestRegistry`に登録するだけである。

```kotlin :line-numbers
fun collectGameTests(asmDataTable: ASMDataTable) {
    val asmDataSet: Set<ASMDataTable.ASMData> = asmDataTable.getAll(GameTestHolder::class.java.canonicalName)
    for (asmData in asmDataSet) {
        val clazz: Class<*> = Class.forName(asmData.className)
        if (!clazz.isAnnotationPresent(GameTestHolder::class.java)) continue
        val holder = clazz.getAnnotation(GameTestHolder::class.java)!!
        for (method in clazz.methods) {
            if (!method.isAnnotationPresent(GameTest::class.java)) continue
            validateTestMethod(method)
            val annotation: GameTest = method.getAnnotation(GameTest::class.java)!!
            val timeOutTicks = annotation.timeoutTicks
            val setupTicks = annotation.setupTicks
            val definition = GameTestDefinition(
                createTestName(holder, clazz, method),
                createStructureLocation(holder, clazz, method),
                setupTicks, timeOutTicks,
                methodIntoConsumer(method)
            )
            GameTestRegistry.register(definition)
        }
    }
}
```

やっていることは簡単で、

1. クラスを取得し、本当に`@GameTestHolder`がついているか確認して、`GameTestHolder`を変数に入れる (4-6行)
2. クラスのメソッドでforを回し
3. メソッドをvalidate(後述)
4. アノテーションを取得して、その情報からGameTestDefinitionを作成 (10-18行)
5. GameTestRegistryに登録

### createTestNameとcreateStructureLocation

createTestNameとcreateStructureLocationは名前の通り、アノテーションの情報や、それが無いならクラス名などからテスト名やStructureの名前空間を作成している。
testNameはシンプルなのだが、structureLocationは少々複雑。

1. Annotationに`template`が指定されていないなら、`$holderの名前空間:$class名_$method名`の形式
1. `template`に":"が含まれている、すなわち`ResourceLocation`の形式であればそのまま使う
1. ":"はないが`template`が指定されているなら、`$holderの名前空間:$class名_$template`の形式

というように決まる。

```kotlin
fun createTestName(holder: GameTestHolder, clazz: Class<*>, method: Method): String {
    return "${holder.namespace}.${clazz.simpleName.lowercase()}.${method.name.lowercase()}"
}

fun createStructureLocation(holder: GameTestHolder, clazz: Class<*>, method: Method): ResourceLocation {
    val gameTest = method.getAnnotation(GameTest::class.java)!!
    if (gameTest.template.isEmpty()) {
        return ResourceLocation(holder.namespace, "${clazz.simpleName.lowercase()}_${method.name.lowercase()}")
    }
    val structureName = gameTest.template
    return if (structureName.contains(":")) {
        ResourceLocation(structureName)
    } else {
        ResourceLocation("${holder.namespace}:${clazz.simpleName}_${structureName.lowercase()}")
    }
}
```

class名とtemplate名の値の区切り文字が`_`なのは、このバージョンだと`.`を含められないからである。

### validateTestMethod

テストメソッドは、`IGameTestHelper`ただ1つを引数にとる必要がある。

```kotlin
private fun validateTestMethod(method: Method) {
    if (method.parameterCount != 1 || method.parameters[0].type != IGameTestHelper::class.java) {
        throw IllegalArgumentException(
            "Game test method '${method.name}' must have exactly one parameter of type IGameTestHelper."
        )
    }
}
```

### methodIntoConsumer

テストメソッドを`Consumer<IGameTestHelper>`に変換する。
staticならそのまま呼び出し、インスタンスメソッドならインスタンスを生成してから呼び出す。

```kotlin
private fun methodIntoConsumer(method: Method): java.util.function.Consumer<IGameTestHelper> {
    return java.util.function.Consumer { helper: IGameTestHelper ->
        try {
            if (java.lang.reflect.Modifier.isStatic(method.modifiers)) {
                method.invoke(null, helper)
            } else {
                val instance = method.declaringClass.getDeclaredConstructor().newInstance()
                method.invoke(instance, helper)
            }
        } catch (e: Exception) {
            throw RuntimeException("Failed to invoke game test method '${method.name}'", e)
        }
    }
}
```

## StructureBlockの召喚

さて、ここまでで`@GameTest`が付けられたメソッドを収集し、`GameTestDefinition`を作成するところまでできた。
ここからは、それを実行、評価するための機構を作っていく。

まずは第一歩として、`/mctest runall`コマンドを実行したら自分の位置にStructureBlockが召喚され、モードをLoadに、テンプレートも設定された状態にされる、という機能を実装してみよう。

### クラス達を定義

まずは実行時のコンテキストを保持する`GameTestContext`を作成。

```kotlin
data class GameTestContext(
    val world: WorldServer,
    val structureBlockPos: BlockPos,
)
```

次に、ContextとDefinition両方を持ち、空間を確保したりStructureを召喚したりする`GameTestCase`を作成。
ひとまず、StructureBlockの召喚と設定だけ。
```kotlin
class GameTestCase(
    private val context: GameTestContext,
    private val test: GameTestDefinition,
) {
    fun prepare() {
        val pos = context.structureBlockPos
        val world: WorldServer = context.world
        world.setBlockState(pos, Blocks.STRUCTURE_BLOCK.defaultState)
        val structureTile = world.getTileEntity(pos)
        if (structureTile == null) {
            McTestLogger.error("Structure block at $pos is null, cannot prepare test ${test.testName}")
            return
        }
        if (structureTile !is TileEntityStructure) {
            McTestLogger.error("Tile entity at $pos is not a StructureBlockTileEntity, cannot prepare test ${test.testName}")
            return
        }
        structureTile.mode = TileEntityStructure.Mode.LOAD
        structureTile.name = test.templateStructure.toString()
    }
}
```

最後に、複数テスト実行の管理をする予定の`GameTestExecutor`を作成。

```kotlin
object GameTestExecutor {
    fun run(world: WorldServer, pos: BlockPos, testName: String): Boolean {
        val def = GameTestRegistry.getTest(testName)
        if (def == null) return false
        val context = GameTestContext(world, pos)
        val testCase = GameTestCase(context, def)
        return true
    }

    fun runAll(world: WorldServer, pos: BlockPos) {
        GameTestRegistry.getAllTests().forEach { (name: String, definition: GameTestDefinition) ->
            val context = GameTestContext(world, pos)
            val testCase = GameTestCase(context, definition)
            testCase.prepare()
        }
    }
}
```

### コマンドを作成

`CommandBase`を継承すると簡単に作成できる。

```kotlin
object GameTestCommand : CommandBase() {
    override fun getName(): String {
        return "mctest" // コマンド名
    }

    override fun getUsage(sender: ICommandSender): String {
        return """
            Usage: /mctest COMMAND [args...]
            Commands:
              runall - Runs all game tests
            """
            .trimIndent()
    }

    override fun execute(server: MinecraftServer, sender: ICommandSender, args: Array<out String?>) {
        if (args.isEmpty()) {
            throw CommandException(getUsage(sender))
        }

        when (args[0]) {
            "runall" -> runAll(server, sender, args)
            "help" -> sender.sendMessage(TextComponentString(getUsage(sender)))
            else -> throw CommandException(getUsage(sender))
        }
    }

    private fun runAll(server: MinecraftServer, sender: ICommandSender, args: Array<out String?>) {
        val worldServer = server.worlds[0] // Assuming the first world is the target
        val pos = sender.position
        GameTestExecutor.runAll(worldServer, pos)
    }
}
```

重要なのは`execute`メソッドで、ここでコマンドの引数を解析し、適切な処理を呼び出す。
今回は、`runall`の場合に`GameTestExecutor.runAll`を呼び出すようにした。

## 動かしてみる

適当なワールドを作成して、`/mctest runall`を実行してみる。

<video controls="controls" src="./0605-structure-block.mp4"></video>

すると、プレイヤーの足元にStructureBlockが召喚され、Loadモードに設定されたうえでテンプレートが`mctest:tests_testexample`に設定される。
うまく動いている！やったね。

## 次回

次回、StructureBlockの周辺をクリーンアップして、StructureのLoadをしてみる。
あわよくばブロックの設置とか簡単なテストまで実装したい。