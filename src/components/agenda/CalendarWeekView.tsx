import { useMemo, useState, useRef, useLayoutEffect } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, setHours, setMinutes, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarEvent } from "./CalendarEvent";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import type { Appointment } from "@/hooks/useAppointments";
import type { BusinessHour, Holiday } from "@/hooks/useBusinessHours";
import { Coffee } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  calendar_color: string | null;
  is_active: boolean | null;
  lunch_break_enabled?: boolean;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
}

interface CalendarWeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onSlotClick: (date: Date, barberId?: string) => void;
  openingTime?: string;
  closingTime?: string;
  timezone?: string;
  isCompactMode?: boolean;
  barbers?: Barber[];
  selectedBarberId?: string | null;
  businessHours?: BusinessHour[];
  holidays?: Holiday[];
  isOpenOnDate?: (date: Date) => boolean;
  getOpeningHours?: (date: Date) => { opening: string; closing: string } | null;
  isHoliday?: (date: Date) => Holiday | undefined;
}

const DEFAULT_HOUR_HEIGHT = 80;
const MIN_HOUR_HEIGHT = 32;
const HEADER_HEIGHT = 56;

export function CalendarWeekView({ 
  currentDate, 
  appointments, 
  onAppointmentClick, 
  onSlotClick,
  openingTime,
  closingTime,
  timezone,
  isCompactMode = false,
  barbers = [],
  selectedBarberId = null,
  businessHours = [],
  holidays = [],
  isOpenOnDate,
  getOpeningHours,
  isHoliday,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const { hour: currentHour, minute: currentMinute, isToday } = useCurrentTime(timezone);

  // Check if showing all barbers (use ultra compact mode)
  const showAllBarbers = selectedBarberId === null && barbers.length > 0;

  // Parse fallback opening and closing hours
  const fallbackOpeningHour = openingTime ? parseInt(openingTime.split(":")[0], 10) : 7;
  const fallbackClosingHour = closingTime ? parseInt(closingTime.split(":")[0], 10) : 21;

  // Calculate min/max hours across all days of the week for display
  const { minHour, maxHour } = useMemo(() => {
    let min = fallbackOpeningHour;
    let max = fallbackClosingHour;
    
    if (getOpeningHours) {
      days.forEach(day => {
        const hours = getOpeningHours(day);
        if (hours) {
          const dayOpen = parseInt(hours.opening.split(":")[0], 10);
          const dayClose = parseInt(hours.closing.split(":")[0], 10);
          min = Math.min(min, dayOpen);
          max = Math.max(max, dayClose);
        }
      });
    }
    
    return { minHour: min, maxHour: max };
  }, [days, getOpeningHours, fallbackOpeningHour, fallbackClosingHour]);

  // Generate hours array based on business hours in compact mode
  const HOURS = useMemo(() => {
    if (isCompactMode) {
      return Array.from({ length: maxHour - minHour }, (_, i) => i + minHour);
    }
    return Array.from({ length: 14 }, (_, i) => i + 7);
  }, [isCompactMode, minHour, maxHour]);

  // Calculate dynamic height for compact mode and scrollbar width
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
      if (scrollContainerRef.current) {
        const width = scrollContainerRef.current.offsetWidth - scrollContainerRef.current.clientWidth;
        setScrollbarWidth(width);
      }
    };
    
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  const hourHeight = useMemo(() => {
    if (!isCompactMode) return DEFAULT_HOUR_HEIGHT;
    
    const effectiveHeight = containerHeight > 0 
      ? containerHeight 
      : window.innerHeight - 220;
    
    const availableHeight = effectiveHeight - HEADER_HEIGHT;
    const calculatedHeight = Math.floor(availableHeight / HOURS.length);
    return Math.max(MIN_HOUR_HEIGHT, calculatedHeight);
  }, [isCompactMode, containerHeight, HOURS.length]);

  // Organize appointments by day and hour
  const appointmentsByDayAndHour = useMemo(() => {
    const map: Record<string, Record<number, Appointment[]>> = {};
    
    days.forEach(day => {
      const dayKey = format(day, "yyyy-MM-dd");
      map[dayKey] = {};
      HOURS.forEach(hour => {
        map[dayKey][hour] = [];
      });
    });

    appointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const dayKey = format(aptDate, "yyyy-MM-dd");
      const hour = aptDate.getHours();
      
      if (map[dayKey] && map[dayKey][hour]) {
        map[dayKey][hour].push(apt);
      }
    });

    return map;
  }, [appointments, days, HOURS]);

  // Calculate current time indicator position
  const firstHour = HOURS[0];
  const lastHour = HOURS[HOURS.length - 1];
  const showTimeIndicator = currentHour >= firstHour && currentHour < lastHour + 1;
  const timeIndicatorPosition = (currentHour - firstHour) * hourHeight + (currentMinute / 60) * hourHeight;

  // Check if a specific hour is within business hours for a specific day
  const isWithinBusinessHoursForDay = (day: Date, hour: number) => {
    if (getOpeningHours) {
      const hours = getOpeningHours(day);
      if (hours) {
        const dayOpen = parseInt(hours.opening.split(":")[0], 10);
        const dayClose = parseInt(hours.closing.split(":")[0], 10);
        return hour >= dayOpen && hour < dayClose;
      }
    }
    return hour >= fallbackOpeningHour && hour < fallbackClosingHour;
  };

  // Check if a specific hour slot overlaps with selected barber's lunch break
  const isWithinLunchBreak = (hour: number) => {
    if (!selectedBarberId) return false;
    
    const barber = barbers.find(b => b.id === selectedBarberId);
    if (!barber?.lunch_break_enabled || !barber.lunch_break_start || !barber.lunch_break_end) {
      return false;
    }
    
    const [startHour] = barber.lunch_break_start.split(":").map(Number);
    const [endHour, endMin] = barber.lunch_break_end.split(":").map(Number);
    const lunchEndHour = endMin > 0 ? endHour : endHour;
    
    return hour >= startHour && hour < lunchEndHour;
  };

  const selectedBarber = selectedBarberId ? barbers.find(b => b.id === selectedBarberId) : null;

  return (
    <div 
      ref={containerRef}
      data-calendar-container
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="min-w-[800px] h-full flex flex-col overflow-hidden">
        {/* Header with days - FIXED */}
        <div 
          className="grid grid-cols-8 border-b border-border bg-card z-10 shrink-0" 
          style={{ height: HEADER_HEIGHT, paddingRight: scrollbarWidth }}
        >
          <div className="p-2 text-center text-xs text-muted-foreground border-r border-border flex items-center justify-center">
            Horário
          </div>
          {days.map(day => {
            const isClosed = isOpenOnDate ? !isOpenOnDate(day) : false;
            const holiday = isHoliday ? isHoliday(day) : undefined;
            
            return (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-r border-border last:border-r-0 flex flex-col items-center justify-center ${
                  isToday(day) ? "bg-primary/10" : ""
                } ${isClosed ? "bg-muted/50" : ""}`}
              >
                <p className="text-xs text-muted-foreground capitalize">
                  {format(day, "EEE", { locale: ptBR })}
                </p>
                <p className={`text-lg font-semibold ${isToday(day) ? "text-primary" : ""} ${isClosed ? "text-muted-foreground" : ""}`}>
                  {format(day, "d")}
                </p>
                {holiday && (
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 truncate max-w-full">
                    {holiday.name}
                  </p>
                )}
                {isClosed && !holiday && (
                  <p className="text-[10px] text-muted-foreground">Fechado</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Time slots - SCROLLABLE */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-scroll overflow-x-hidden min-h-0 overscroll-contain">
          <div className="grid grid-cols-8 relative">
            {/* Time column */}
            <div className="border-r border-border">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="border-b border-border text-xs text-muted-foreground text-right pr-2 flex items-start justify-end pt-1"
                  style={{ height: DEFAULT_HOUR_HEIGHT }}
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const isDayToday = isToday(day);
              const isClosed = isOpenOnDate ? !isOpenOnDate(day) : false;
              
              return (
                <div key={day.toISOString()} className={`border-r border-border last:border-r-0 relative ${isClosed ? "bg-muted/30" : ""}`}>
                  {/* Current time indicator - only on today's column */}
                  {isDayToday && showTimeIndicator && !isClosed && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${timeIndicatorPosition}px` }}
                    >
                      <div className="relative flex items-center">
                        <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm" />
                        <div className="w-full h-0.5 bg-red-500" />
                      </div>
                    </div>
                  )}
                  
                  {/* Closed overlay */}
                  {isClosed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="bg-muted/80 text-muted-foreground px-3 py-1 rounded text-sm font-medium">
                        Fechado
                      </div>
                    </div>
                  )}
                  
                  {HOURS.map(hour => {
                    const slotAppointments = appointmentsByDayAndHour[dayKey]?.[hour] || [];
                    const slotDate = setMinutes(setHours(day, hour), 0);
                    const withinHours = isWithinBusinessHoursForDay(day, hour);
                    const isLunchBreak = isWithinLunchBreak(hour);

                    return (
                      <div
                        key={hour}
                        className={`border-b border-border p-0.5 transition-colors ${
                          isClosed 
                            ? "bg-muted/40 cursor-not-allowed" 
                            : isLunchBreak
                              ? "bg-orange-100/60 dark:bg-orange-900/20 cursor-not-allowed"
                              : `cursor-pointer hover:bg-muted/30 ${
                                  withinHours 
                                    ? "bg-blue-100/40 dark:bg-blue-900/20" 
                                    : ""
                                } ${isDayToday && withinHours ? "bg-blue-100/50 dark:bg-blue-900/30" : ""}`
                        }`}
                        style={{ height: DEFAULT_HOUR_HEIGHT }}
                        onClick={() => !isClosed && !isLunchBreak && onSlotClick(slotDate)}
                      >
                        {isLunchBreak && slotAppointments.length === 0 && !isClosed ? (
                          <div className="h-full flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                            <Coffee className="h-3 w-3" />
                            <span className="text-[10px] font-medium">Intervalo</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5 overflow-hidden h-full">
                            {slotAppointments.map(apt => (
                              <CalendarEvent
                                key={apt.id}
                                appointment={apt}
                                onClick={() => onAppointmentClick(apt)}
                                ultraCompact={showAllBarbers}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
