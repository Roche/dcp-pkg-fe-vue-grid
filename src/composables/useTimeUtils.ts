import { toZonedTime, format as formatWithTimezone } from 'date-fns-tz';
import { formatDistanceToNow, Locale } from 'date-fns';
import { enUS, de } from 'date-fns/locale';
import { useI18n } from 'vue-i18n';
import { logger } from '@open-dcp/utilities';

/**
 * Parses a UTC ISO date string and formats it with timezone support.
 */
function parseAndFormatDate(
    dateString: string,
    outputFormat: string,
    timeZone: string
): string | null {
    try {
        const utcDate = new Date(dateString);
        const zonedDate = toZonedTime(utcDate, timeZone);
        return formatWithTimezone(zonedDate, outputFormat, { timeZone });
    } catch (error) {
        logger.error('Error parsing or formatting date:', error);
        return null;
    }
}

/**
 * Gets the current UTC ISO string with microseconds.
 */
function getCurrentUtcIsoString(): string {
    return new Date().toISOString();
}

/**
 * Composable for time formatting utilities.
 */
export function useTimeUtils() {
    const { locale: currentLocale } = useI18n();

    // Map vue-i18n locales to date-fns locales
    const dateFnsLocales: Record<string, Locale> = {
        en: enUS,
        de: de,
    };

    /**
     * Formats a date into a human-readable relative time string.
     */
    function formatRelativeTime(date: Date | string, addSuffix = true): string {
        try {
            const dateFnsLocale = dateFnsLocales[currentLocale.value] || enUS;
            const parsedDate = typeof date === 'string' ? new Date(date) : date;
            return formatDistanceToNow(parsedDate, { addSuffix, locale: dateFnsLocale });
        } catch (error) {
            logger.error('Error formatting relative time:', error);
            return 'Invalid date';
        }
    }

    return {
        formatRelativeTime,
        parseAndFormatDate,
        getCurrentUtcIsoString,
    };
}