# light generator

一个非常轻量的模板生成器，用于各种脚手架的生成。

## 使用

```ts
import {LightGenerator} from 'light-generator';

const generator = new LightGenerator({
  templatePath: 'npm://xxxx'
});
await generator.run({
  name: 'demo'
});
```

## 添加规则

生成器可以在生成完模板文件后，做一些自定义的操作，比如替换内容，修改文件名等。

```ts
import {LightGenerator, ignoreRule} from 'light-generator';
const generator = new LightGenerator({
  templatePath: 'npm://xxxx',
  rule: [ignoreRule]
});
```


## 其他

此模块核心代码从 serverless 模块中抽取。
