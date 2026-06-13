import { useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { uploadImage } from '../services/images.js';

function parseContent(raw) {
  if (!raw) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
}

export function useDocEditor({ contentJson, placeholder = 'start writing…', onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content: parseContent(contentJson),
    onUpdate,
    editorProps: {
      handlePaste(view, event) { onPaste(event); return false; },
    },
  });

  async function insertImageFromFile(file) {
    try {
      const url = await uploadImage(file);
      editor.value?.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      window.alert(`image upload failed: ${err?.message || err}`);
    }
  }

  function onPaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { event.preventDefault(); insertImageFromFile(file); return; }
      }
    }
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

  function setContent(raw) {
    editor.value?.commands.setContent(parseContent(raw) || '', false);
  }

  return { editor, insertImageFromFile, onLinkClick, setContent };
}
