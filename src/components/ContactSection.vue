<script setup>
import SectionHeader from './SectionHeader.vue';
import { profile } from '../data/profile.js';

const rows = [
  { label: 'mail',  value: profile.email,    href: `mailto:${profile.email}` },
  { label: 'phone', value: profile.phone,    href: `tel:${profile.phone}` },
  { label: 'git',   value: `github.com/${profile.github}`,    href: `https://github.com/${profile.github}` },
  { label: 'link',  value: `linkedin.com/in/${profile.linkedin}`, href: `https://linkedin.com/in/${profile.linkedin}` },
];
</script>

<template>
  <section>
    <SectionHeader name="contact" id="contact" />
    <a
      v-for="r in rows"
      :key="r.label"
      class="contact-row"
      :href="r.href"
      :target="r.href.startsWith('http') ? '_blank' : undefined"
      :rel="r.href.startsWith('http') ? 'noopener' : undefined"
    >
      <span class="prompt">$</span>
      <span class="label">{{ r.label }}</span>
      <span class="value">{{ r.value }}</span>
    </a>
  </section>
</template>

<style scoped>
.contact-row {
  display: grid;
  grid-template-columns: 1.5ch 7ch 1fr;
  gap: 1ch;
  padding: 10px 0;
  font-size: var(--fs-sm);
  color: var(--text);
  text-decoration: none;
  border-bottom: 1px solid var(--border);
}
.contact-row:last-child { border-bottom: none; }
.contact-row:hover .value { color: var(--accent); }
.prompt { color: var(--prompt); }
.label  { color: var(--text-dim); }
.value  { color: var(--text); }
</style>
