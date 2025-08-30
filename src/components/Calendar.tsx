import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import resourceTimeGridPlugin  from "@fullcalendar/resource-timegrid";
import jaLocale from "@fullcalendar/core/locales/ja";
import multiMonthPlugin from '@fullcalendar/multimonth'

import bootstrap5Plugin from "@fullcalendar/bootstrap5";


import "@fullcalendar/daygrid";



interface Event {
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
}

export default function Calendar() {
  const [events, setEvents] = useState<Event[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});

  const fetchHolidays = async () => {
    try {
      const holidayURL = `${window.location.origin}/api/holiday/`;
      console.log("Holiday URL:", holidayURL);
      const response = await fetch(holidayURL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventURL = `${window.location.origin}/api/event/`;
      console.log("Event URL:", eventURL);
      const response = await fetch(eventURL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchEvents();
  }, []);

  const renderDayCellContent = (dayCellContent: any) => {
    if (dayCellContent.view.type !== "dayGridMonth") return;

    const dateStr = dayCellContent.date.toLocaleDateString("sv-SE");
    const holidayName = holidays[dateStr];
    const isHoliday = Boolean(holidayName);

    return (
      <>
        <span className={isHoliday ? "holiday-number" : ""}>
          {dayCellContent.date.getDate()}
        </span>
        {isHoliday ? <span className="holiday-label">{holidayName}</span> : null}
      </>
    );
  };

  return (
    <div className="demo-app-main">
      <FullCalendar
        plugins={[bootstrap5Plugin, multiMonthPlugin]}
        themeSystem=""
        initialView="multiMonthYear"
        locale={jaLocale}
        events={events}
        eventClassNames={(arg) => {
        return arg.event.allDay ? 'bg-info text-red' : 'bg-success text-blue';
        }}
       // eventclassNames={() => 'bg-danger text-white'}  // Bootstrap classes
        dayCellContent={renderDayCellContent}
        headerToolbar={{
          left: "",
          center: "title",
          right: "today prev,next",
        }}
        height="55vh"
        businessHours={true}
        fixedWeekCount={false}
        dayMaxEvents={false}
        eventDisplay="block"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
  		
      />
    </div>
  );
}
