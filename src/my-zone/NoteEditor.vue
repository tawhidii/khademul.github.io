<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { EditorContent } from '@tiptap/vue-3';
import { useNotes } from './composables/useNotes.js';
import { onAuthError } from './composables/useAuth.js';
import { useDocEditor } from './composables/useDocEditor.js';
import { useAutosave } from './composables/useAutosave.js';
import { makeExcerpt } from './services/text.js';

const props = defineProps({ note: { type: Object, required: true } });

const { updateNote } = useNotes();
const title = ref(props.note.title || '');
const fileInput = ref(null);

const { editor, insertImageFromFile, onLinkClick, setContent } = useDocEditor({
  contentJson: props.note.contentJson,
  onUpdate: () => save.schedule(),
});

function snapshot() {
  if (!editor.value) return null;
  return {
    title: title.value,
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: makeExcerpt(editor.value.getText()),
  };
}

const save = useAutosave((patch) => updateNote(props.note.$id, patch), snapshot);
const status = save.status;
const statusText = save.statusText;

function onTitleInput() { save.schedule(); }
function onImageClick() { fileInput.value?.click(); }
async function onFilePicked(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file) await insertImageFromFile(file);
}
function retry() { save.retry(); }

watch(
  () => props.note.$id,
  () => {
    title.value = props.note.title || '';
    setContent(props.note.contentJson);
    save.cancel();
  },
);

const offAuthError = onAuthError(() => {
  const payload = snapshot();
  if (payload) {
    try {
      sessionStorage.setItem(`my-zone:unsaved:${props.note.$id}`, JSON.stringify({ ...payload, savedAt: Date.now() }));
    } catch { /* best effort */ }
  }
});

onBeforeUnmount(() => {
  save.cancel();
  offAuthError();
  editor.value?.destroy();
});
</script>

<template>
  <div class="editor">
    <input
      v-model="title"
      class="editor__title"
      placeholder="Untitled"
      @input="onTitleInput"
    />
    <div v-if="editor" class="editor__toolbar">
      <button type="button" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">•</button>
      <button type="button" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button type="button" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">"</button>
      <span class="editor__sep"></span>
      <button type="button" :class="{ active: editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">`</button>
      <button type="button" :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">{ }</button>
      <span class="editor__sep"></span>
      <button type="button" @click="onLinkClick">link</button>
      <button type="button" @click="onImageClick">image</button>
      <input ref="fileInput" type="file" accept="image/*" class="editor__file" @change="onFilePicked" />
    </div>
    <EditorContent v-if="editor" :editor="editor" class="editor__content" />
    <footer class="editor__status">
      <span :class="['editor__status-text', `editor__status-text--${status.state}`]">{{ statusText() }}</span>
      <button v-if="status.state === 'error'" class="editor__retry" type="button" @click="retry">retry</button>
    </footer>
  </div>
</template>

<style scoped>
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px 32px;
  overflow-y: auto;
}

.editor__title {
  background: transparent;
  border: none;
  color: var(--text, #e6e6e6);
  font-family: inherit;
  font-size: 24px;
  padding: 8px 0;
  margin-bottom: 16px;
}

.editor__title:focus {
  outline: none;
}

.editor__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border, #222);
}

.editor__toolbar button {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid transparent;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  min-width: 28px;
}

.editor__toolbar button:hover {
  color: var(--text, #e6e6e6);
  border-color: var(--border, #222);
}

.editor__toolbar button.active {
  color: var(--accent, #6cf);
  border-color: var(--accent, #6cf);
}

.editor__sep {
  width: 1px;
  height: 16px;
  background: var(--border, #222);
  margin: 0 4px;
}

.editor__content {
  flex: 1;
  color: var(--text, #e6e6e6);
  font-size: 15px;
  line-height: 1.7;
}

.editor__status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 0;
  font-size: 11px;
  color: var(--text-dim, #999);
}

.editor__status-text--error {
  color: #f66;
}

.editor__retry {
  background: transparent;
  color: var(--text-dim, #999);
  border: 1px solid var(--border, #222);
  padding: 2px 8px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.editor__file {
  display: none;
}
</style>

<style>
/* unscoped — TipTap renders content outside scoped styles */
.editor__content .ProseMirror {
  outline: none;
  min-height: 200px;
}

.editor__content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-dim, #666);
  pointer-events: none;
  height: 0;
}

.editor__content h1 { font-size: 22px; margin: 16px 0 8px; }
.editor__content h2 { font-size: 18px; margin: 14px 0 6px; }
.editor__content h3 { font-size: 16px; margin: 12px 0 6px; }
.editor__content ul, .editor__content ol { padding-left: 24px; }
.editor__content code {
  background: var(--bg-elev, #111);
  padding: 1px 6px;
  font-size: 13px;
  border-radius: 2px;
}
.editor__content pre {
  background: var(--bg-elev, #111);
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
  border-radius: 2px;
}
.editor__content pre code { background: transparent; padding: 0; }
.editor__content a { color: var(--accent, #6cf); text-decoration: underline; }
.editor__content img { max-width: 100%; height: auto; }
</style>
