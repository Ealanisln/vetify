'use client';

import { WEBHOOK_EVENT_CATEGORIES, WEBHOOK_EVENTS, type WebhookEventType } from '@/lib/webhooks';

interface WebhookEventSelectorProps {
  selectedEvents: string[];
  onChange: (events: string[]) => void;
  disabled?: boolean;
}

export function WebhookEventSelector({
  selectedEvents,
  onChange,
  disabled = false,
}: WebhookEventSelectorProps) {
  const handleToggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      onChange(selectedEvents.filter((e) => e !== event));
    } else {
      onChange([...selectedEvents, event]);
    }
  };

  const handleToggleCategory = (categoryEvents: WebhookEventType[]) => {
    const allSelected = categoryEvents.every((e) => selectedEvents.includes(e));
    if (allSelected) {
      onChange(selectedEvents.filter((e) => !categoryEvents.includes(e as WebhookEventType)));
    } else {
      const newEvents = new Set([...selectedEvents, ...categoryEvents]);
      onChange(Array.from(newEvents));
    }
  };

  const handleSelectAll = () => {
    const allEvents = Object.keys(WEBHOOK_EVENTS);
    if (selectedEvents.length === allEvents.length) {
      onChange([]);
    } else {
      onChange(allEvents);
    }
  };

  const allEventsCount = Object.keys(WEBHOOK_EVENTS).length;
  const allSelected = selectedEvents.length === allEventsCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Eventos <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
        >
          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(WEBHOOK_EVENT_CATEGORIES).map(([category, events]) => {
          const categorySelected = events.filter((e) => selectedEvents.includes(e)).length;
          const allCategorySelected = categorySelected === events.length;

          return (
            <div
              key={category}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allCategorySelected}
                    onChange={() => handleToggleCategory(events)}
                    disabled={disabled}
                    className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {categorySelected}/{events.length}
                </span>
              </div>

              {/* Events */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {events.map((event) => (
                  <label
                    key={event}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event)}
                      onChange={() => handleToggleEvent(event)}
                      disabled={disabled}
                      className="mt-0.5 h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary disabled:opacity-50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {event}
                        </code>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {WEBHOOK_EVENTS[event]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvents.length === 0 && (
        <p className="text-xs text-red-500">Debes seleccionar al menos un evento</p>
      )}
    </div>
  );
}
