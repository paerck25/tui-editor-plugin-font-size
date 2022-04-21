import type { PluginContext, PluginInfo, HTMLMdNode } from "@toast-ui/editor";
import type { Transaction, Selection, TextSelection } from "prosemirror-state";
import { PluginOptions } from "@t/index";
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

export default function fontSizePlugin(
  context: PluginContext,
  options: PluginOptions = {}
): PluginInfo {
  const { eventEmitter, pmState } = context;

  const container = document.createElement("div");

  const inputForm = createInput();

  inputForm.onsubmit = (ev) => {
    ev.preventDefault();
    const input = inputForm.querySelector(".size-input") as HTMLInputElement;
    eventEmitter.emit("command", "fontSize", {
      fontSize: input.value + "px",
    });
    eventEmitter.emit("closePopup");
  };

  container.appendChild(inputForm);

  function onClickDropDown(fontSize: string) {
    eventEmitter.emit("command", "fontSize", { fontSize });
    eventEmitter.emit("closePopup");
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
          const attrs = {
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
        span(node: HTMLMdNode, { entering }: any) {
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
