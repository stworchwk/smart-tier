/**
 * Utility for formatting output with optional emoji support
 */

/**
 * Emoji symbols used throughout the application
 */
export const Emojis = {
  target: '🎯',
  checklist: '📋',
  line: '───────────────────────────────────────',
  search: '🔍',
  check: '✓',
  info: 'ℹ️',
  pin: '📌',
  blocked: '🚫',
  warning: '⚠️',
  budget: '💰',
  chart: '📊',
  robot: '🤖',
  gear: '⚙️',
} as const;

/**
 * Text alternatives for emojis
 */
export const TextIcons = {
  target: '[TARGET]',
  checklist: '[TASK]',
  line: '───────────────────────────────────────',
  search: '[SEARCH]',
  check: '[OK]',
  info: '[INFO]',
  pin: '[CONFIG]',
  blocked: '[BLOCKED]',
  warning: '[WARN]',
  budget: '[$]',
  chart: '[STATS]',
  robot: '[AI]',
  gear: '[SETTINGS]',
} as const;

/**
 * Formatter class that handles emoji display based on configuration
 */
export class Formatter {
  private useEmojis: boolean;

  constructor(useEmojis: boolean = true) {
    this.useEmojis = useEmojis;
  }

  /**
   * Set whether to use emojis
   */
  setUseEmojis(useEmojis: boolean): void {
    this.useEmojis = useEmojis;
  }

  /**
   * Get an emoji or text alternative based on configuration
   */
  icon(iconName: keyof typeof Emojis): string {
    return this.useEmojis ? Emojis[iconName] : TextIcons[iconName];
  }

  /**
   * Create a section header
   */
  header(title: string): string {
    return `${this.icon('checklist')} ${title}`;
  }

  /**
   * Create a divider line
   */
  divider(): string {
    return Emojis.line;
  }

  /**
   * Create a warning message
   */
  warning(message: string): string {
    return `${this.icon('warning')} ${message}`;
  }

  /**
   * Create an error message
   */
  error(message: string): string {
    return `${this.icon('blocked')} ${message}`;
  }

  /**
   * Create a success message
   */
  success(message: string): string {
    return `${this.icon('check')} ${message}`;
  }

  /**
   * Create an info message
   */
  info(message: string): string {
    return `${this.icon('info')} ${message}`;
  }

  /**
   * Create a blocked message
   */
  blocked(message: string): string {
    return `${this.icon('blocked')} ${message}`;
  }
}

/**
 * Default formatter instance (will be configured per server context)
 */
let defaultFormatter: Formatter | null = null;

/**
 * Initialize the default formatter
 */
export function initFormatter(useEmojis: boolean): Formatter {
  defaultFormatter = new Formatter(useEmojis);
  return defaultFormatter;
}

/**
 * Get the default formatter
 */
export function getFormatter(): Formatter {
  if (!defaultFormatter) {
    defaultFormatter = new Formatter(true);
  }
  return defaultFormatter;
}
