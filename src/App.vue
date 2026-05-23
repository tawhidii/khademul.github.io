<script setup>
import SiteNav from './components/SiteNav.vue';
import TerminalHero from './components/TerminalHero.vue';
import AboutSection from './components/AboutSection.vue';
import ExperienceSection from './components/ExperienceSection.vue';
import SkillsSection from './components/SkillsSection.vue';
import EducationSection from './components/EducationSection.vue';
import ContactSection from './components/ContactSection.vue';
</script>

<template>
  <SiteNav />
  <TerminalHero />
  <main>
    <AboutSection />
    <ExperienceSection />
    <SkillsSection />
    <EducationSection />
    <ContactSection />
  </main>
  <footer class="site-footer">
    <p>Built with Vue. Source on <a href="https://github.com/tawhidii/tawhidii.github.io" target="_blank" rel="noopener">github.com/tawhidii/tawhidii.github.io</a>.</p>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--rhythm);
  padding: 32px 16px 48px;
  text-align: center;
  color: var(--text-dim);
  font-size: var(--fs-xs);
  border-top: 1px solid var(--border);
}
</style>
