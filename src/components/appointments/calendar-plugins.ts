/**
 * FullCalendar plugins for the appointments calendar.
 *
 * The calendar runs in the clinic's timezone (a named IANA zone), not the
 * browser's. Without a timezone plugin FullCalendar "UTC-coerces" named
 * zones and hands callbacks Dates that are off by the clinic's UTC offset,
 * so a dragged or selected 10:00 slot would be saved as 10:00 UTC. The Luxon
 * plugin converts through Intl, so callbacks get the real instant.
 */
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import luxonPlugin from '@fullcalendar/luxon3';

export const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, luxonPlugin];
