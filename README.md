# light generator

一个非常轻量的脚手架生成器，用于各种脚手架的生成。

核心功能：

- 获取模板到本地（支持本地模板，github 地址，或者npm 地址）
- 拷贝到指定的用户路径
- 执行自定义规则（比如替换文件名等）

## Quick Guide

```ts
import {LightGenerator} from 'light-generator';

const generator = new LightGenerator().defineNpmPackage({
  npmPackage: 'egg-boilerplate-simple',
  targetPath
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
    - copyRule { CopyRule[] } 可选，可以通过这个配置，传递自定义拷贝规则
    
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
  copyRule: [customRule]
});
```

内置了一些默认规则，比如

- ignoreRule： 用于一些可能会被忽略的文件，在模板文件前缀加入下划线（_），执行此规则会移除该下划线
- replaceRule: 用于替换文本内容

这些规则默认已经内置，并且生效。

**示例**

```ts
import {LightGenerator, ignoreRule} from 'light-generator';
const generator = new LightGenerator({
  copyRule: [ignoreRule]
});
```

如果不希望这些规则生效，请在初始化时关闭，并自行传递规则。

**示例**

```ts
import {LightGenerator, ignoreRule} from 'light-generator';
const generator = new LightGenerator({
  disableDefaultRule: true,
  copyRule: [ignoreRule]
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
    ]
  }
}
```

参数

- root { string } 设置模板根路径，相对于包根路径，如果配置了 `boilerplateConfig` 字段，默认为 `boilerplate` 目录
- replaceParameter { string } 用户可替换参数文件路径，相对于包根路径，默认为 `index.js`
- replaceFile { string | string []} 需要替换的文件列表，默认为 `README.md`，相对于 root


## 其他

此模块部门核心代码从 serverless 模块中抽取。
