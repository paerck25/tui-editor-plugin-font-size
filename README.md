# tui-editor-plugin-font-size

This is a plugin of [TOAST UI Editor](https://github.com/nhn/tui.editor/tree/master/apps/editor) to size editing text.

![font-size](./readme_img.png)

### Install

```sh
$ npm install tui-editor-plugin-font-size

or

$ yarn add tui-editor-plugin-font-size
```

### Useage

```js
import Editor from "@toast-ui/editor";
import fontSize from "tui-editor-plugin-font-size";
import "tui-editor-plugin-font-size/dist/tui-editor-plugin-font-size.css";

const editor = new Editor({
  // ...
  plugins: [colorSyntax],
});
```
