<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useNotes } from './composables/useNotes.js';

const props = defineProps({
  note: { type: Object, required: true },
});

const { updateNote } = useNotes();

const title = ref(props.note.title || '');
const status = ref({ state: 'idle', at: null, message: '' }); // idle | editing | saving | saved | error

let debounceHandle = null;
let inFlight = false;
let pendingPayload = null;
let lastSavedAt = null;

function parseContent(raw) {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
    Image,
    Placeholder.configure({ placeholder: 'start writing…' }),
  ],
  content: parseContent(props.note.contentJson),
  onUpdate: scheduleSave,
});

watch(
  () => props.note.$id,
  () => {
    title.value = props.note.title || '';
    editor.value?.commands.setContent(parseContent(props.note.contentJson) || '', false);
    status.value = { state: 'idle', at: null, message: '' };
    if (debounceHandle) {
      clearTimeout(debounceHandle);
      debounceHandle = null;
    }
    pendingPayload = null;
  }
);

function snapshot() {
  if (!editor.value) return null;
  return {
    title: title.value,
    contentHtml: editor.value.getHTML(),
    contentJson: JSON.stringify(editor.value.getJSON()),
    excerpt: editor.value.getText().slice(0, 300),
  };
}

function scheduleSave() {
  status.value = { state: 'editing', at: Date.now(), message: '' };
  if (debounceHandle) clearTimeout(debounceHandle);
  debounceHandle = setTimeout(flush, 1000);
}

async function flush() {
  if (!editor.value) return;
  const payload = snapshot();
  if (!payload) return;

  if (inFlight) {
    pendingPayload = payload;
    return;
  }
  inFlight = true;
  status.value = { state: 'saving', at: Date.now(), message: '' };
  try {
    await updateNote(props.note.$id, payload);
    lastSavedAt = Date.now();
    status.value = { state: 'saved', at: lastSavedAt, message: '' };
  } catch (err) {
    status.value = { state: 'error', at: Date.now(), message: err?.message || 'save failed' };
  } finally {
    inFlight = false;
    if (pendingPayload) {
      pendingPayload = null;
      scheduleSave();
    }
  }
}

function retry() {
  flush();
}

function onTitleInput() {
  scheduleSave();
}

function onLinkClick() {
  if (!editor.value) return;
  const previous = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previous || 'https://');
  if (url === null) return;
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

function statusText() {
  switch (status.value.state) {
    case 'idle':
      return '';
    case 'editing':
      return 'editing…';
    case 'saving':
      return 'saving…';
    case 'saved': {
      const secs = Math.max(1, Math.round((Date.now() - status.value.at) / 1000));
      return `saved · ${secs}s ago`;
    }
    case 'error':
      return `save failed — ${status.value.message}`;
    default:
      return '';
  }
}

onBeforeUnmount(() => {
  if (debounceHandle) clearTimeout(debounceHandle);
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
