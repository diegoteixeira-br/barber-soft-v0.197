import { useMemo } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "./CalendarEvent";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import type { Appointment } from "@/hooks/useAppointments";
import type { Barber } from "@/hooks/useBarbers";

interface CalendarDayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  barbers: Barber[];
  selectedBarberId: string | null;
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: Date, barberId?: string) => void;
  openingTime?: string;
  closingTime?: string;
  timezone?: string;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 to 20:00
const HOUR_HEIGHT = 96; // h-24 = 6rem = 96px

export function CalendarDayView({
  currentDate,
  appointments,
  barbers,
  selectedBarberId,
  onAppointmentClick,
  onSlotClick,
  openingTime,
  closingTime,
  timezone,
}: CalendarDayViewProps) {
  const activeBarbers = useMemo(
    () => barbers.filter(b => b.is_active && (!selectedBarberId || b.id === selectedBarberId)),
    [barbers, selectedBarberId]
  );

  const { hour: currentHour, minute: currentMinute, isToday } = useCurrentTime(timezone);
  const today = isToday(currentDate);

  // Parse opening and closing hours
  const openingHour = openingTime ? parseInt(openingTime.split(":")[0], 10) : 7;
  const closingHour = closingTime ? parseInt(closingTime.split(":")[0], 10) : 21;

  const appointmentsByBarberAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    
    activeBarbers.forEach(barber => {
      map[barber.id] = {};
      HOURS.forEach(hour => {
        map[barber.id][hour] = [];
      });
    });

    appointments.forEach(apt => {
      if (!apt.barber_id) return;
      const hour = new Date(apt.start_time).getHours();
      if (map[apt.barber_id] && map[apt.barber_id][hour]) {
        map[apt.barber_id][hour].push(apt);
      }
    });

    return map;
  }, [appointments, activeBarbers]);

  // Calculate current time indicator position
  const showTimeIndicator = today && currentHour >= 7 && currentHour < 21;
  const timeIndicatorPosition = (currentHour - 7) * HOUR_HEIGHT + (currentMinute / 60) * HOUR_HEIGHT;

  const isWithinBusinessHours = (hour: number) => {
    return hour >= openingHour && hour < closingHour;
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className={`min-w-[600px] ${activeBarbers.length > 3 ? "min-w-[900px]" : ""}`}>
        {/* Header with barbers */}
        <div className={`grid border-b border-border sticky top-0 bg-card z-10`} style={{ gridTemplateColumns: `80px repeat(${activeBarbers.length}, 1fr)` }}>
          <div className="p-3 text-center border-r border-border">
            <p className="text-sm text-muted-foreground capitalize">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </p>
            <p className={`text-2xl font-bold ${today ? "text-primary" : ""}`}>
              {format(currentDate, "d")}
            </p>
          </div>
          {activeBarbers.map(barber => (
            <div
              key={barber.id}
              className="p-3 text-center border-r border-border last:border-r-0"
              style={{ borderTop: `3px solid ${barber.calendar_color || "#FF6B00"}` }}
            >
              <p className="font-semibold text-foreground">{barber.name}</p>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid relative" style={{ gridTemplateColumns: `80px repeat(${activeBarbers.length}, 1fr)` }}>
          {/* Current time indicator - spans across all columns */}
          {showTimeIndicator && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${timeIndicatorPosition}px` }}
            >
              <div className="relative flex items-center">
                <div className="absolute left-[68px] w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                <div className="ml-[80px] flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}

          {/* Time column */}
          <div className="border-r border-border">
            {HOURS.map(hour => (
              <div
                key={hour}
                className={`h-24 border-b border-border flex items-start justify-end pr-2 pt-1 ${
                  isWithinBusinessHours(hour) ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                }`}
              >
                <span className="text-sm text-muted-foreground">
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Barber columns */}
          {activeBarbers.map(barber => (
            <div key={barber.id} className="border-r border-border last:border-r-0">
              {HOURS.map(hour => {
                const slotAppointments = appointmentsByBarberAndHour[barber.id]?.[hour] || [];
                const slotDate = setMinutes(setHours(currentDate, hour), 0);
                const withinHours = isWithinBusinessHours(hour);

                return (
                  <div
                    key={hour}
                    className={`h-24 border-b border-border p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                      withinHours 
                        ? "bg-blue-100/40 dark:bg-blue-900/20" 
                        : ""
                    } ${today && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`}
                    onClick={() => onSlotClick(slotDate, barber.id)}
                  >
                    <div className="space-y-1 overflow-hidden h-full">
                      {slotAppointments.map(apt => (
                        <CalendarEvent
                          key={apt.id}
                          appointment={apt}
                          onClick={() => onAppointmentClick(apt)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
