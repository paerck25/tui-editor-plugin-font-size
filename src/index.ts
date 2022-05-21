import type { PluginContext, PluginInfo, HTMLMdNode } from "@toast-ui/editor";
import type { Transaction, Selection, TextSelection } from "prosemirror-state";
import type { Attr, Mark, PluginOptions } from "@t/index";
import type { Context } from "@toast-ui/editor/types/toastmark";
import "./css/plugin.css";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96];

function createInput() {
  const form = document.createElement("form");
  form.innerHTML = "<input class='size-input' type='number' />";
  return form;
}

function creaetFontSizeDropDown() {
  const dropDownContainer = document.createElement("div");
  dropDownContainer.className = "drop-down";

  let item = "";

  FONT_SIZES.forEach((size) => {
    item += `<div class="drop-down-item">${size}px</div>`;
  });

  dropDownContainer.innerHTML = item;

  return dropDownContainer;
}

function createToolbarItemOption(dropDown: HTMLDivElement) {
  return {
    name: "font-size",
    text: "F",
    tooltip: "Font Size",
    style: { background: "none", fontSize: "20px" },
    popup: {
      body: dropDown,
      style: { width: "100px", maxHeight: "200px", overflow: "auto" },
    },
  };
}

function createSelection(
  tr: Transaction,
  selection: Selection,
  SelectionClass: typeof TextSelection,
  openTag: string,
  closeTag: string
) {
  const { mapping, doc } = tr;
  const { from, to, empty } = selection;
  const mappedFrom = mapping.map(from) + openTag.length;
  const mappedTo = mapping.map(to) - closeTag.length;

  return empty
    ? SelectionClass.create(doc, mappedTo, mappedTo)
    : SelectionClass.create(doc, mappedFrom, mappedTo);
}

const getSpanAttrs = (selection: Selection) => {
  const slice = selection.content();
  let attrs: Attr = {
    htmlAttrs: null,
    htmlInline: null,
    classNames: null,
  };
  slice.content.nodesBetween(0, slice.content.size, (node: any) => {
    if (node.marks.length > 0) {
      node.marks.forEach((mark: Mark) => {
        if (mark.type.name === "span") {
          attrs = mark.attrs;
        }
      });
    }
  });
  return attrs;
};

const assignFontSize = (prevStyle: string, fontSize: string) => {
  if (prevStyle.includes("font-size")) {
    const styles = prevStyle.split(";");
    const newStyle = styles.map((style) => {
      if (style.includes("font-size")) {
        return `font-size: ${fontSize}`;
      }
      return style;
    });

    return newStyle.join(";");
  }
  return `font-size: ${fontSize}; ${prevStyle}`;
};

function hasClass(element: HTMLElement, className: string) {
  return element.classList.contains(className);
}

export function findParentByClassName(el: HTMLElement, className: string) {
  let currentEl: HTMLElement | null = el;

  while (currentEl && !hasClass(currentEl, className)) {
    currentEl = currentEl.parentElement;
  }

  return currentEl;
}

function getCurrentEditorEl(
  colorPickerEl: HTMLElement,
  containerClassName: string
) {
  const editorDefaultEl = findParentByClassName(
    colorPickerEl,
    `toastui-editor-defaultUI`
  )!;

  return editorDefaultEl.querySelector<HTMLElement>(
    `.${containerClassName} .ProseMirror`
  )!;
}

let containerClassName: string;
let currentEditorEl: HTMLElement;

export default function fontSizePlugin(
  context: PluginContext,
  options: PluginOptions = {}
): PluginInfo {
  const { eventEmitter, pmState } = context;

  eventEmitter.listen("focus", (editType) => {
    containerClassName = `toastui-editor-${
      editType === "markdown" ? "md" : "ww"
    }-container`;
  });

  const container = document.createElement("div");

  const inputForm = createInput();

  inputForm.onsubmit = (ev) => {
    ev.preventDefault();
    const input = inputForm.querySelector(".size-input") as HTMLInputElement;
    currentEditorEl = getCurrentEditorEl(container, containerClassName);

    eventEmitter.emit("command", "fontSize", {
      fontSize: input.value + "px",
    });
    eventEmitter.emit("closePopup");

    currentEditorEl.focus();
  };

  container.appendChild(inputForm);

  function onClickDropDown(fontSize: string) {
    currentEditorEl = getCurrentEditorEl(container, containerClassName);

    eventEmitter.emit("command", "fontSize", { fontSize });
    eventEmitter.emit("closePopup");

    currentEditorEl.focus();
  }

  const dropDown = creaetFontSizeDropDown();

  dropDown.querySelectorAll(".drop-down-item").forEach((el) => {
    el.addEventListener("click", (ev) => {
      const fontSize = (ev.target as HTMLElement).innerText;
      onClickDropDown(fontSize);
    });
  });

  container.appendChild(dropDown);

  const toolbarItem = createToolbarItemOption(container);

  return {
    markdownCommands: {
      fontSize: ({ fontSize }, { tr, selection, schema }, dispatch) => {
        if (fontSize) {
          const slice = selection.content();
          const textContent = slice.content.textBetween(
            0,
            slice.content.size,
            "\n"
          );

          const openTag = `<span style="font-size: ${fontSize};">`;
          const closeTag = `</span>`;
          const fontSized = `${openTag}${textContent}${closeTag}`;

          tr.replaceSelectionWith(schema.text(fontSized)).setSelection(
            createSelection(
              tr,
              selection,
              pmState.TextSelection,
              openTag,
              closeTag
            )
          );

          dispatch!(tr);

          return true;
        }
        return false;
      },
    },
    wysiwygCommands: {
      fontSize: ({ fontSize }, { tr, selection, schema }, dispatch) => {
        if (fontSize) {
          const { from, to } = selection;

          const prevAttrs = getSpanAttrs(selection);

          const style = assignFontSize(
            prevAttrs.htmlAttrs?.["style"] || "",
            fontSize
          );

          const attrs = prevAttrs
            ? {
                ...prevAttrs,
                htmlAttrs: {
                  ...prevAttrs.htmlAttrs,
                  style: style,
                },
              }
            : {
                htmlAttrs: {
                  style: `font-size: ${fontSize};`,
                },
              };

          const mark = schema.marks.span.create(attrs);

          tr.addMark(from, to, mark);
          dispatch!(tr);

          return true;
        }
        return false;
      },
    },
    toolbarItems: [
      {
        groupIndex: 0,
        itemIndex: 4,
        item: toolbarItem,
      },
    ],
    toHTMLRenderers: {
      htmlInline: {
        span(node: HTMLMdNode, { entering }: Context) {
          return entering
            ? {
                type: "openTag",
                tagName: "span",
                attributes: node.attrs!,
              }
            : { type: "closeTag", tagName: "span" };
        },
      },
    },
  };
}
