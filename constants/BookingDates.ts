export interface DateOption {
  id: string;
  label: string;
  badge?: string;
  timeSlot?: string;
}

export function getBookingDateOptions(): DateOption[] {
  const options: DateOption[] = [
    {
      id: 'today-urgent',
      label: 'Today - Emergency / ASAP (Within 45-60 Mins)',
      badge: 'URGENT',
      timeSlot: 'ASAP',
    },
    {
      id: 'today-morning',
      label: 'Today - Morning (09:00 AM - 12:00 PM)',
      badge: 'Today',
      timeSlot: '09:00 AM - 12:00 PM',
    },
    {
      id: 'today-afternoon',
      label: 'Today - Afternoon (01:00 PM - 04:00 PM)',
      badge: 'Today',
      timeSlot: '01:00 PM - 04:00 PM',
    },
    {
      id: 'today-evening',
      label: 'Today - Evening (05:00 PM - 08:00 PM)',
      badge: 'Today',
      timeSlot: '05:00 PM - 08:00 PM',
    },
    {
      id: 'tomorrow-morning',
      label: 'Tomorrow - Morning (09:00 AM - 12:00 PM)',
      badge: 'Tomorrow',
      timeSlot: '09:00 AM - 12:00 PM',
    },
    {
      id: 'tomorrow-afternoon',
      label: 'Tomorrow - Afternoon (01:00 PM - 04:00 PM)',
      badge: 'Tomorrow',
      timeSlot: '01:00 PM - 04:00 PM',
    },
    {
      id: 'tomorrow-evening',
      label: 'Tomorrow - Evening (05:00 PM - 08:00 PM)',
      badge: 'Tomorrow',
      timeSlot: '05:00 PM - 08:00 PM',
    },
  ];

  // Dynamic next 5 days
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  for (let i = 2; i <= 6; i++) {
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + i);
    const dayName = dayNames[futureDate.getDay()];
    const dateNum = futureDate.getDate();
    const month = monthNames[futureDate.getMonth()];
    const dateFormatted = `${dayName}, ${month} ${dateNum}`;

    options.push({
      id: `day-${i}-morning`,
      label: `${dateFormatted} - Morning (10:00 AM - 01:00 PM)`,
      badge: dayName,
      timeSlot: '10:00 AM - 01:00 PM',
    });
    options.push({
      id: `day-${i}-afternoon`,
      label: `${dateFormatted} - Afternoon (02:00 PM - 05:00 PM)`,
      badge: dayName,
      timeSlot: '02:00 PM - 05:00 PM',
    });
  }

  // Custom manual entry option
  options.push({
    id: 'custom-date',
    label: 'Custom Date & Time (Type below)',
    badge: 'Custom',
    timeSlot: 'Custom',
  });

  return options;
}
