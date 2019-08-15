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

## 其他

此模块核心代码从 serverless 模块中抽取。
