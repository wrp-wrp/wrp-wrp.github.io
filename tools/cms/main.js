import CMS from '@sveltia/cms';

// The npm build includes fonts, translations and lazy-loaded libraries locally.
// Keep the existing /admin/config.yml, repository, browser drafts and login origin.
export function start() {
  return CMS.init();
}
