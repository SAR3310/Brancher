// ============================================================
// Brancher - Branch Templates
// Predefined channel templates untuk berbagai tipe branch
// ============================================================

/**
 * Template definitions untuk branch
 * Setiap template define channels yang akan dibuat
 */
const BRANCH_TEMPLATES = {
  /**
   * Empty template - tidak ada channel default
   */
  empty: {
    name: "Kosong",
    description: "Mulai dari nol tanpa channel default",
    channels: [],
  },

  /**
   * Default template - 3 channel standar
   * Cocok untuk komunitas umum
   */
  default: {
    name: "Standar",
    description: "3 channel: pengumuman, umum, santai",
    channels: [
      { name: "pengumuman", type: "announce", position: 0 },
      { name: "umum", type: "text", position: 1 },
      { name: "santai", type: "text", position: 2 },
    ],
  },

  /**
   * Dev template - channels untuk developer/tech community
   */
  dev: {
    name: "Developer",
    description: "Channels untuk tech discussion & coding",
    channels: [
      { name: "pengumuman", type: "announce", position: 0 },
      { name: "general", type: "text", position: 1 },
      { name: "javascript", type: "text", position: 2 },
      { name: "python", type: "text", position: 3 },
      { name: "tips-tricks", type: "text", position: 4 },
      { name: "showcase", type: "text", position: 5 },
    ],
  },

  /**
   * Gaming template - channels untuk gaming community
   */
  gaming: {
    name: "Gaming",
    description: "Channels untuk gaming discussion & community",
    channels: [
      { name: "pengumuman", type: "announce", position: 0 },
      { name: "general", type: "text", position: 1 },
      { name: "lfg", type: "text", position: 2 }, // Looking for group
      { name: "streams", type: "text", position: 3 },
      { name: "memes", type: "text", position: 4 },
      { name: "off-topic", type: "text", position: 5 },
    ],
  },
};

/**
 * Get template definition by name
 * @param {string} templateName
 * @returns {object} Template object atau default (empty)
 */
function getTemplate(templateName) {
  return BRANCH_TEMPLATES[templateName] || BRANCH_TEMPLATES.empty;
}

/**
 * Get list of available templates
 * @returns {array} Array of template info
 */
function getAvailableTemplates() {
  return Object.entries(BRANCH_TEMPLATES).map(([key, template]) => ({
    id: key,
    name: template.name,
    description: template.description,
    channelCount: template.channels.length,
  }));
}

module.exports = {
  BRANCH_TEMPLATES,
  getTemplate,
  getAvailableTemplates,
};
