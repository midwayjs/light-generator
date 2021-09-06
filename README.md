# light generator

一个非常轻量的脚手架生成器，用于各种脚手架的生成。

核心功能：

- 获取模板到本地（支持本地模板，github 地址，或者npm 地址）
- 拷贝到指定的用户路径
- 执行自定义规则（比如替换文件名等）

在很多时候，我们希望自己的模板在不同的脚手架（CLI）工具中都能够调用，基于这个需求，我们开发了比较轻量级的生成器，可以嵌入到不同的脚手架工具中。

这个包只提供生成模板的能力和所希望的 API，外部可以对接不同的 CLI 工具。

## Quick Guide

```ts
import {LightGenerator} from 'light-generator';

const generator = new LightGenerator().defineNpmPackage({
  npmPackage: 'egg-boilerplate-simple',
  targetPath,
  npmInstall: true,
});

await generator.run({
  name: 'demo'
});
```

默认会将模板中的下划线前缀的文件替换为正常文件名，并替换模板中的 `{{xxx}}` 变量为传入的参数。

## LightGenerator

### Constructor

- options {object}
    - disableDefaultRule {boolean} 可选，默认 false，用于禁止默认规则;
    - rules { CopyRule[] } 可选，可以通过这个配置，传递自定义拷贝规则

### API

`LightGenerator` 通过定义一系列格式，返回一个特定格式的生成器，执行该生成器即可拿到相应的结果。

```ts
interface LightGenerator {
  defineLocalPath(options): CommonGenerator;
  defineNpmPackage(options): CommonGenerator;
}

interface CommonGenerator {
  async getParameterList(): object;
  async run(replaceParameter?: object);
}
```

- getParameterList() 获取该生成器（模板）定义的用户可覆盖的配置
- run() 执行该生成器，在这个时候传入用户覆盖的配置

#### defineLocalPath

生成本地路径的模板

- options {object}
    - templatePath { string } 本地模板路径
    - targetPath { string } 需要拷贝到的目录

**示例**

```ts
const localGenerator = new LightGenerator().defineLocalPath({
  templatePath: join(__dirname, './fixtures/boilerplate-2'),
  targetPath
});
```

#### defineNpmPackage

生成一个 npm 包资源类型的模板

- options {object}
    - npmPackage { string } npm 包名
    - targetPath { string } 需要拷贝到的目录
    - npmClient { string } 可选，默认为 npm

**示例**

```ts
const npmGenerator = new LightGenerator().defineNpmPackage({
  npmPackage: 'egg-boilerplate-simple',
  targetPath
});
```

#### clean cache

由于本模块会下载 npm 包到本地特定的临时目录，可以通过暴露的方法清理该目录。

注意，此方法为静态方法。

```ts
await LightGenerator.cleanCache();
```


## Add custom copy rule

生成器可以在生成完模板文件后，做一些自定义的操作，比如替换内容，修改文件名等。

简单的来说，规则是一个函数，参数为当前文件路径，用于对当前文件进行操作。

**示例**

```ts
import {LightGenerator} from 'light-generator';

const customRule = async (currentFilePath) => {
  // TODO
}

const generator = new LightGenerator({
  rules: [customRule]
});
```

内置了一些默认规则，比如

- ignoreRule： 用于一些可能会被忽略的文件，在模板文件前缀加入下划线（_），执行此规则会移除该下划线
- replaceRule: 用于将变量替换掉带 {{}} 的文本内容，或者文件名

这些规则默认已经内置，并且生效。

**示例**

```ts
import {LightGenerator, ignoreRule} from 'light-generator';
const generator = new LightGenerator({
  rules: [ignoreRule]
});
```

如果不希望这些规则生效，请在初始化时关闭，并自行传递规则。

**示例**

```ts
import {LightGenerator, ignoreRule} from 'light-generator';
const generator = new LightGenerator({
  disableDefaultRule: true,
  rules: [ignoreRule]
});
```

## 模板规则

默认情况下，会拷贝整个模板目录的内容到目标目录，但是在 `package.json` 中加入 `boilerplateConfig` 段落可以额外配置这个行为。

```json
{
  "boilerplateConfig": {
    "root": "template",
    "replaceParameter": "index.js",
    "replaceFile": [
      "src/index.ts"
    ],
    "rule": []
  }
}
```

也可以支持通配符

```json
{
  "boilerplateConfig": {
    "root": "template",
    "replaceParameter": "index.js",
    "replaceFile": [
      "*.ts"
    ]
  }
}
```

参数

- root { string } 设置模板根路径，相对于包根路径，如果配置了 `boilerplateConfig` 字段，默认为 `boilerplate` 目录
- replaceParameter { string } 用户可替换参数文件路径，相对于包根路径，默认为 `index.js`
- replaceFile { string []} 需要替换的文件列表，默认为 `README.md`，相对于 root，请一定填写规则修改前的文件名，支持 [minimatch](https://github.com/isaacs/minimatch) 格式的通配符
- rule { string []} 只对本模板生效自定义 copy 规则，内容为可以 require 的地址，内容格式为 `module.exports = async () => {}`
- beforeAll { string } 模板创建执行之前会执行的代码地址，内容为可以 require 的地址，如果内容为方法，则参数为 options
  - options
      - sourceRoot 模板源根路径，比如本地下载的地址
      - templateRoot 模板源路径，比如下载到本地的模板里面的 boilerplate 目录
      - targetRoot 目标路径，实际拷贝到的地址
      - replaceParameter 用户替换的参数
      - templateConfig pkg 中定义的 `boilerplateConfig` 配置内容
- afterAll { string } 所有拷贝都完成之后会执行代码地址，内容为可以 require 的地址，如果内容为方法，则参数为 options，同 beforeAll

## 事件

```js
const generator = new LightGenerator().defineNpmPackage({
  npmPackage: 'egg-boilerplate-simple',
  targetPath
});

/**
 * 模板下载完毕，准备创建
 */
generator.onTemplateReady(() => {
  // log
});

/**
 * 每个文件被拷贝时触发
 */
generator.onFileCreated((data: {
  sourceFullFilePath: string;
  targetFullFilePath: string;
  destDir: string;
  relativeFilePath: string;
}) => {
  // log
});

await generator.run({
  name: 'demo'
});
```

- sourceFullFilePath 源模板文件绝对路径
- targetFullFilePath 要拷贝的目标绝对路径
- destDir 要拷贝的目标目录
- relativeFilePath 要拷贝的目标文件

## 其他

此模块部分核心代码从 serverless 模块中抽取。

## 协议

[MIT](LICENSE)
