import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, Activity, ShieldCheck, Zap, TrendingUp, 
  Map as MapIcon, CheckCircle2, Clock, Filter, FileText, 
  Users, TrendingDown, Droplets, ChevronRight, Info, 
  Maximize2, Briefcase, LocateFixed, Layers, Database, 
  History, Eye, Truck, HardHat, Stethoscope, RefreshCw, 
  ShieldAlert, CheckSquare, Square, Wind, Hammer, Play
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';

// --- КОНФИГУРАЦИЯ И КОНСТАНТЫ (Синхронизация с ТЗ и Таблицей 15) ---

const MUNICIPALITIES = [
  { id: 'north', name: "Северный", path: "M 50 20 L 150 20 L 140 80 L 40 70 Z", multiplier: 1.1, population: "320 000", mainRisk: "Леса" },
  { id: 'south', name: "Южный", path: "M 150 150 L 250 160 L 230 250 L 120 240 Z", multiplier: 0.9, population: "410 000", mainRisk: "Засуха" },
  { id: 'center', name: "Центральный", path: "M 140 80 L 220 70 L 250 160 L 150 150 Z", multiplier: 1.0, population: "550 000", mainRisk: "Транспорт" },
  { id: 'mountain', name: "Горный", path: "M 220 70 L 320 50 L 350 180 L 250 160 Z", multiplier: 0.85, dangerZone: true, population: "180 000", mainRisk: "Сель" },
  { id: 'coastal', name: "Прибрежный", path: "M 40 70 L 140 80 L 150 150 L 120 240 L 30 220 Z", multiplier: 1.2, population: "120 000", mainRisk: "Шторм" }
];

const KPI_METADATA = [
  { id: 'tourist', name: 'Турпоток', unit: 'млн гостей/год', baseValue: 2.9, basePeriodDays: 365, target: [2.6, 3.2], warning: [2.4, 3.4], critical: [2.2, 3.7], category: 'ECONOMY', source: 'Департамент туризма', freq: 'Ежедневно', type: 'Регулярный', request_name: 'Сводная статистика турпотока', isRate: false, desc: 'Количество уникальных посетителей за период.', isKey: true },
  { id: 'eco', name: 'Индекс экологического качества', unit: 'баллы', baseValue: 78, basePeriodDays: 1, target: [80, 90], warning: [75, 95], critical: [70, 100], category: 'ECO', source: 'Экологическая служба', freq: 'Real-time', type: 'Регулярный', request_name: 'Индекс экологического качества', isRate: true, desc: 'Комплексный показатель качества воздуха и воды.', isKey: true },
  { id: 'budget', name: 'Доходы бюджета', unit: 'млрд руб', baseValue: 218, basePeriodDays: 365, target: [220, 235], warning: [210, 250], critical: [200, 260], category: 'ECONOMY', source: 'Департамент финансов', freq: 'Ежедневно', type: 'Регулярный', request_name: 'Доходы бюджета', isRate: false, desc: 'Налоговые и неналоговые поступления в бюджет.', isKey: true },
  { id: 'social_inv', name: 'Инвестиции в соцсферу', unit: 'млрд руб', baseValue: 42, basePeriodDays: 365, target: [45, 55], warning: [38, 60], critical: [32, 65], category: 'SOCIAL', source: 'Минстрой', freq: 'Месяц', type: 'Регулярный', request_name: 'Освоение инвестиций в соцсферу', isRate: false, desc: 'Капитальные вложения в строительство школ и больниц.', isKey: false },
  { id: 'med_access', name: 'Медицинская доступность', unit: '% населения', baseValue: 86, basePeriodDays: 1, target: [85, 92], warning: [82, 95], critical: [78, 100], category: 'SOCIAL', source: 'Минздрав региона, СМП', freq: 'Real-time', type: 'Регулярный', request_name: 'Доступность медпомощи', isRate: true, desc: 'Доля населения ≤25 мин до медпомощи.', isKey: true },
  { id: 'employment', name: 'Уровень занятости', unit: '%', baseValue: 96.6, basePeriodDays: 1, target: [96.0, 98.0], warning: [95.5, 99.0], critical: [94.5, 100], category: 'SOCIAL', source: 'Служба занятости', freq: 'Месяц', type: 'Регулярный', request_name: 'Уровень занятости', isRate: true, desc: 'Отношение численности занятых к рабочей силе.', isKey: false },
  { id: 'salary', name: 'Средняя зарплата', unit: 'руб/мес', baseValue: 86500, basePeriodDays: 30, target: [88000, 98000], warning: [84000, 105000], critical: [80000, 110000], category: 'ECONOMY', source: 'Аналитика рынка труда', freq: 'Месяц', type: 'Регулярный', request_name: 'Средняя зарплата', isRate: true, desc: 'Среднемесячная начисленная плата.', isKey: false },
  { id: 'wine', name: 'Выпуск вина', unit: 'тыс л/мес', baseValue: 130, basePeriodDays: 365, target: [125, 145], warning: [120, 160], critical: [110, 170], category: 'ECONOMY', source: 'Служба АПК', freq: 'Неделя', type: 'Регулярный', request_name: 'Выпуск вина', isRate: false, desc: 'Объем производства винодельческой продукции.', isKey: false },
  { id: 'reject_wine', name: 'Доля брака вина', unit: '%', baseValue: 1.2, basePeriodDays: 1, target: [0.5, 1.5], warning: [2.0, 2.5], critical: [3.0, 5.0], category: 'ECONOMY', source: 'Служба АПК', freq: 'Регулярный', type: 'Регулярный', request_name: 'Доля брака вина', isRate: true, desc: 'Лабораторный контроль качества продукции.', isKey: false },
  { id: 'accize', name: 'Акцизы на алкоголь', unit: 'млн руб/мес', baseValue: 450, basePeriodDays: 30, target: [430, 480], warning: [400, 500], critical: [380, 550], category: 'ECONOMY', source: 'Департамент финансов', freq: 'Регулярный', type: 'Регулярный', request_name: 'Акцизы на алкоголь', isRate: false, desc: 'Поступления акцизов по данным налоговой.', isKey: false },
  { id: 'precip', name: 'Интенсивность осадков', unit: 'мм/ч', baseValue: 2, basePeriodDays: 1, target: [0, 5], warning: [14, 18], critical: [18, 30], category: 'ECO', source: 'Гидрометео-служба', freq: 'По запросу', type: 'По запросу', request_name: 'Интенсивность осадков', isRate: true, desc: 'Данные метеостанций и прогнозы.', isKey: true },
  { id: 'water_lvl', name: 'Уровень воды на створах', unit: 'м', baseValue: 0.2, basePeriodDays: 1, target: [0, 0.3], warning: [0.5, 0.9], critical: [1.1, 2.5], category: 'INFRA', source: 'Гидрометео-служба', freq: 'По запросу', type: 'По запросу', request_name: 'Уровень воды на створах', isRate: true, desc: 'Датчики уровней на гидропостах.', isKey: true },
];

const managementSteps = [
  { title: 'Сигнал', data: 'Датчики осадков, гидропосты, ГЛОНАСС СМП.', kpi: 'Индекс осадков, Уровень воды', result: 'ПОРОГОВОЕ УВЕДОМЛЕНИЕ (АЛЕРТ)' },
  { title: 'Аналитика', data: 'Временные ряды, корреляция с рельефом.', kpi: 'Тренд осадков, Прогноз селя', result: 'РЕЖИМ WARNING/EMERGENCY' },
  { title: 'Решение', data: 'Регламент реагирования №45-ЧС.', kpi: 'Крит. пороги доступности', result: 'ПАКЕТ МЕР ОПЕРШТАБА' },
  { title: 'Поручение', data: 'Ресурсные ведомости ведомств.', kpi: 'Доля занятых ресурсов', result: 'ЗАДАЧИ В КОНТУРЕ ИСПОЛНЕНИЯ' },
  { title: 'Контроль', data: 'Фотофиксация, трекеры техники.', kpi: 'Статус исполнения %', result: 'ЗАКРЫТИЕ ИНЦИДЕНТА' },
];

// --- ФУНКЦИИ НЕЧЕТКОЙ ЛОГИКИ ---

const trapmf = (x, a, b, c, d) => {
  if (x <= a) return (a === b) ? 1 : 0;
  if (x >= d) return (c === d) ? 1 : 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (b - a === 0) ? 1 : (x - a) / (b - a);
  if (x > c && x < d) return (d - c === 0) ? 1 : (d - x) / (d - c);
  return 0;
};

const trimf = (x, a, b, c) => {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x > a && x < b) return (b - a === 0) ? 1 : (x - a) / (b - a);
  if (x > b && x < c) return (c - b === 0) ? 1 : (c - x) / (c - b);
  return 0;
};

const calculateFuzzyConfidence = (R, H, B) => {
  const rT = { low: trapmf(R, 0, 0, 3, 7), mid: trimf(R, 5, 12, 19), high: trapmf(R, 14, 18, 30, 30) };
  const hT = { low: trapmf(H, 0, 0, 0.3, 0.7), mid: trimf(H, 0.5, 0.9, 1.3), high: trapmf(H, 1.1, 1.4, 2.5, 2.5) };
  const bT = { low: trapmf(B, 0, 0, 60, 75), mid: trimf(B, 70, 82, 94), high: trapmf(B, 90, 95, 100, 100) };

  const rules = [
    { r: 'low', h: 'low', b: 'low', out: 0 }, { r: 'low', h: 'low', b: 'mid', out: 0 }, { r: 'low', h: 'low', b: 'high', out: 0 },
    { r: 'mid', h: 'low', b: 'low', out: 0 }, { r: 'mid', h: 'low', b: 'mid', out: 0 }, { r: 'mid', h: 'low', b: 'high', out: 0 },
    { r: 'high', h: 'low', b: 'low', out: 0 }, { r: 'high', h: 'low', b: 'mid', out: 0 }, { r: 'high', h: 'low', b: 'high', out: 0 },
    { r: 'low', h: 'mid', b: 'low', out: 0 }, { r: 'low', h: 'mid', b: 'mid', out: 0 }, { r: 'low', h: 'mid', b: 'high', out: 1 },
    { r: 'mid', h: 'mid', b: 'low', out: 0 }, { r: 'mid', h: 'mid', b: 'mid', out: 1 }, { r: 'mid', h: 'mid', b: 'high', out: 1 },
    { r: 'high', h: 'mid', b: 'low', out: 1 }, { r: 'high', h: 'mid', b: 'mid', out: 1 }, { r: 'high', h: 'mid', b: 'high', out: 1 },
    { r: 'low', h: 'high', b: 'low', out: 1 }, { r: 'low', h: 'high', b: 'mid', out: 1 }, { r: 'low', h: 'high', b: 'high', out: 1 },
    { r: 'mid', h: 'high', b: 'low', out: 1 }, { r: 'mid', h: 'high', b: 'mid', out: 1 }, { r: 'mid', h: 'high', b: 'high', out: 1 },
    { r: 'high', h: 'high', b: 'low', out: 1 }, { r: 'high', h: 'high', b: 'mid', out: 1 }, { r: 'high', h: 'high', b: 'high', out: 1 }
  ];

  let s = 0;
  rules.forEach(rule => {
    const weight = Math.min(rT[rule.r], hT[rule.h], bT[rule.b]);
    if (rule.out === 1) s = Math.max(s, weight);
  });
  return s;
};

// --- УТИЛИТЫ ДАННЫХ ---

const getScaledKpiValue = (kpi, munName, mode, triggers, period) => {
  if (!kpi) return 0;
  const mun = MUNICIPALITIES.find(m => m.name === munName);
  const mFactor = mun ? mun.multiplier : 1.0;
  if (kpi.id === 'precip') return triggers.precip;
  if (kpi.id === 'water_lvl') return triggers.water;
  let val = kpi.isRate ? (kpi.baseValue * mFactor) : (kpi.baseValue * mFactor * (period / kpi.basePeriodDays));
  if (mode === 'EMERGENCY') {
    if (kpi.id === 'tourist') val *= 0.15;
    if (kpi.id === 'med_access') val *= 0.75;
    if (kpi.id === 'eco') val *= 0.65;
    if (kpi.id === 'budget') val *= 0.8;
  }
  return parseFloat(val.toFixed(2));
};

const getScaledThreshold = (kpi, threshold, period, munName) => {
  if (!kpi) return 0;
  const mun = MUNICIPALITIES.find(m => m.name === munName);
  const mFactor = mun ? mun.multiplier : 1.0;
  return kpi.isRate ? (threshold * mFactor) : parseFloat((threshold * mFactor * (period / kpi.basePeriodDays)).toFixed(2));
};

const generateScaledHistory = (days, kpi, munName, mode, triggers) => {
  if (!kpi) return [];
  const mun = MUNICIPALITIES.find(m => m.name === munName);
  const mFactor = mun ? mun.multiplier : 1.0;
  const points = days === 1 ? 24 : days;
  return Array.from({ length: points }).map((_, i) => {
    let dailyVal = kpi.isRate ? (kpi.baseValue * mFactor) : (kpi.baseValue * mFactor / kpi.basePeriodDays);
    if (days === 1) dailyVal /= 24;
    const noise = (Math.random() - 0.5) * (dailyVal * 0.15);
    let currentVal = dailyVal + noise;
    if (mode === 'EMERGENCY' && i > points - 4) {
      if (kpi.id === 'precip') currentVal = triggers.precip;
      if (kpi.id === 'water_lvl') currentVal = triggers.water;
    }
    return { date: `p${i}`, value: parseFloat(currentVal.toFixed(2)) };
  });
};

// --- КОМПОНЕНТЫ ИНТЕРФЕЙСА ---

const KpiCard = ({ kpi, filterMun, mode, triggers, filterPeriod, onClick }) => {
  const val = getScaledKpiValue(kpi, filterMun, mode, triggers, filterPeriod);
  const warnScaled = getScaledThreshold(kpi, kpi.warning[0], filterPeriod, filterMun);
  const critScaled = getScaledThreshold(kpi, kpi.critical[0], filterPeriod, filterMun);
  const isBadTrend = kpi.id === 'reject_wine' || kpi.id === 'precip' || kpi.id === 'water_lvl' ? val > warnScaled : val < warnScaled;
  const isCriticalTrend = kpi.id === 'reject_wine' || kpi.id === 'precip' || kpi.id === 'water_lvl' ? val > critScaled : val < critScaled;
  const historyData = useMemo(() => generateScaledHistory(filterPeriod, kpi, filterMun, mode, triggers), [filterPeriod, kpi.id, filterMun, mode, triggers]);
  const displayUnit = kpi.isRate ? kpi.unit : `${kpi.unit} за ${filterPeriod} дн.`;
  return (
    <div onClick={onClick} className={`p-5 rounded-2xl border cursor-pointer transition-all hover:translate-y-[-4px] active:scale-95 group ${mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800 shadow-lg' : 'bg-white border-slate-200 shadow-sm'} ${isCriticalTrend ? 'ring-2 ring-red-500 border-red-500' : isBadTrend ? 'ring-1 ring-yellow-500' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-100 tracking-widest text-current">{kpi.category}</span>
        <div className={`p-1.5 rounded-lg ${isCriticalTrend ? 'bg-red-500/20 text-red-500' : isBadTrend ? 'bg-yellow-500/20 text-yellow-500' : 'bg-indigo-500/10 text-indigo-500'}`}><Activity size={14} /></div>
      </div>
      <h3 className="text-sm font-black mb-1 truncate group-hover:text-indigo-500 transition-colors uppercase tracking-tight text-current">{kpi.name}</h3>
      <div className="flex items-baseline gap-1 mb-4 text-current">
        <span className="text-3xl font-black tracking-tighter">{val.toLocaleString('ru-RU')}</span>
        <span className="text-[10px] font-bold opacity-50 uppercase ml-1">{displayUnit}</span>
      </div>
      <div className="h-16 w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData}>
            <Area type="monotone" dataKey="value" stroke={isCriticalTrend ? '#ef4444' : isBadTrend ? '#eab308' : '#6366f1'} strokeWidth={3} fillOpacity={0.1} fill={isCriticalTrend ? '#ef4444' : isBadTrend ? '#eab308' : '#6366f1'} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-widest text-current">
         <span>Цель: {getScaledThreshold(kpi, kpi.target[0], filterPeriod, filterMun)}-{getScaledThreshold(kpi, kpi.target[1], filterPeriod, filterMun)}</span>
         {isCriticalTrend ? <span className="text-red-500 animate-pulse">Критично</span> : isBadTrend ? <span className="text-yellow-500">Внимание</span> : <span>Норма</span>}
      </div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---

export default function App() {
  const [mode, setMode] = useState('NORMAL');
  const [emState, setEmState] = useState('NORMAL');
  const [filterPeriod, setFilterPeriod] = useState(30);
  const [filterMun, setFilterMun] = useState('Вся губерния');
  const [showKeyOnly, setShowKeyOnly] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [activeTab, setActiveTab] = useState('alerts');
  const [triggers, setTriggers] = useState({ precip: 2, water: 0.2, beds: 65 });
  const [tasks, setTasks] = useState([
    { id: 'T-1045', title: 'Проверка готовности гидропостов', responsible: 'Эко-служба', deadline: 'Завтра, 12:00', status: 'new', checklist: [{ text: 'Обход датчиков', completed: false }, { text: 'Калибровка', completed: false }, { text: 'Фотоотчет', completed: false }] }
  ]);
  const [alerts, setAlerts] = useState([
    { id: 'a1', level: 'info', time: '10:45', kpiId: 'eco', title: 'Плановый мониторинг', desc: 'Служба экологии проводит замеры качества воды.', status: 'new' }
  ]);
  const [modals, setModals] = useState({ brief: false, resources: false });
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredMun, setHoveredMun] = useState(null);

  const [recoveryWizard, setRecoveryWizard] = useState({ weather: false, infra: false, resources: false });

  const kpisToShow = useMemo(() => {
    return showKeyOnly ? KPI_METADATA.filter(k => k.isKey) : KPI_METADATA;
  }, [showKeyOnly]);

  const fuzzyS = useMemo(() => calculateFuzzyConfidence(triggers.precip, triggers.water, triggers.beds), [triggers]);

  // Глобальная логика переходов
  useEffect(() => {
    if (fuzzyS >= 0.5) {
      setMode('EMERGENCY');
      setEmState('EMERGENCY');
      setAlerts(prev => prev.some(a => a.id === 'a_emergency') ? prev : [{ id: 'a_emergency', level: 'critical', time: '11:15', kpiId: 'precip', title: 'ВВЕДЕН РЕЖИМ ЧС "СЕЛЬ"', desc: `Уверенность S=${fuzzyS.toFixed(2)}. База: 27 правил.`, status: 'new' }, ...prev]);
    } else {
      setMode('NORMAL');
      if (triggers.precip <= 3 && triggers.water <= 0.3) {
          if (emState === 'EMERGENCY' || emState === 'STABILIZATION' || emState === 'RECOVERY') {
            setEmState(recoveryWizard.weather || recoveryWizard.infra || recoveryWizard.resources ? 'RECOVERY' : 'STABILIZATION');
          } else {
            setEmState('NORMAL');
          }
      } else if (triggers.precip > 15 || triggers.water > 1.1) {
          setEmState('WARNING');
      } else if (triggers.precip > 5 || triggers.water > 0.5) {
          setEmState('WATCH');
      } else {
          setEmState('NORMAL');
      }
      setAlerts(prev => prev.filter(a => a.id !== 'a_emergency'));
    }
  }, [fuzzyS, triggers, emState, recoveryWizard]);

  const toggleTaskCheck = (taskId, checkIdx) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newCheck = [...t.checklist];
        newCheck[checkIdx].completed = !newCheck[checkIdx].completed;
        const allDone = newCheck.every(c => c.completed);
        return { ...t, checklist: newCheck, status: allDone ? 'done' : 'in_progress' };
      }
      return t;
    }));
  };

  const handleCreateTask = (alert) => {
    const newTask = { id: `T-${Math.floor(Math.random() * 9000 + 1000)}`, title: `Реагирование: ${alert.title}`, responsible: alert.kpiId === 'precip' ? 'МЧС' : 'Минтранс', deadline: 'СЕГОДНЯ, 18:00', status: 'new', checklist: [{ text: 'Развертывание оперштаба', completed: false }, { text: 'Доклад губернатору', completed: false }, { text: 'Мобилизация ресурсов', completed: false }] };
    setTasks([newTask, ...tasks]);
    setAlerts(alerts.map(a => a.id === alert.id ? { ...a, status: 'assigned' } : a));
    setActiveTab('tasks');
  };

  const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  const stabilizeWeather = () => {
    setTriggers({ ...triggers, precip: 1.5, water: 0.2 });
    setRecoveryWizard({ ...recoveryWizard, weather: true });
    setEmState('RECOVERY');
  };
  const stabilizeInfra = () => {
    setRecoveryWizard({ ...recoveryWizard, infra: true });
    setEmState('RECOVERY');
  };
  const stabilizeResources = () => {
    setTriggers({ ...triggers, beds: 65 });
    setRecoveryWizard({ ...recoveryWizard, resources: true });
    setEmState('RECOVERY');
  };
  const finishRecovery = () => {
    setTriggers({ precip: 2, water: 0.2, beds: 65 });
    setMode('NORMAL');
    setEmState('NORMAL');
    setRecoveryWizard({ weather: false, infra: false, resources: false });
  };

  return (
    <div className={`min-h-screen font-sans transition-all duration-500 ${mode === 'EMERGENCY' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 px-6 py-4 border-b backdrop-blur-md transition-colors ${mode === 'EMERGENCY' ? 'bg-slate-950/90 border-red-900/50' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mode === 'EMERGENCY' ? 'bg-red-600 shadow-lg' : 'bg-indigo-600'} text-white`}><ShieldAlert size={24} /></div>
            <div><h1 className="font-black text-lg uppercase tracking-tighter">СЦ ГУБЕРНИИ</h1><p className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-current">MISSION CRITICAL DASHBOARD</p></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex bg-slate-200/50 dark:bg-slate-900/50 p-1 rounded-xl border border-current opacity-60">
              <button onClick={() => {setTriggers({precip: 2, water: 0.2, beds: 65}); setRecoveryWizard({ weather: false, infra: false, resources: false });}} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${mode === 'NORMAL' ? 'bg-white text-indigo-600 shadow-md scale-105' : 'opacity-40'}`}>Штатный режим</button>
              <button onClick={() => setTriggers({precip: 18, water: 1.5, beds: 95})} className={`px-6 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${mode === 'EMERGENCY' ? 'bg-red-600 text-white shadow-lg scale-105' : 'opacity-40'}`}>ЧС СЕЛЬ</button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="text-[10px] font-black uppercase opacity-50">S-Confidence:</span><span className={`px-3 py-1 rounded-full text-[10px] font-black border ${fuzzyS >= 0.5 ? 'bg-red-600 text-white animate-pulse' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>{fuzzyS.toFixed(2)}</span></div>
              <button onClick={() => setModals({...modals, brief: true})} className={`px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'EMERGENCY' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}><FileText size={14}/> Сводка</button>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1600px] mx-auto px-6 py-12 lg:py-20 text-center">
        <h2 className="text-4xl lg:text-7xl font-black uppercase tracking-tighter mb-4 max-w-5xl mx-auto leading-none text-current">Термальная долина: <br/><span className={mode === 'EMERGENCY' ? 'text-red-600' : 'text-indigo-600'}>Цифровая устойчивость</span></h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 text-current">
          {[ { label: 'Население', value: '1.58 млн', icon: Users }, { label: 'ВРП', value: '1.26 трлн', icon: TrendingUp }, { label: 'Бюджет', value: '218 млрд', icon: Zap }, { label: 'Зарплата', value: '86 500 р', icon: Briefcase } ].map((item, idx) => (
            <div key={idx} className={`p-10 rounded-[40px] border transition-all ${mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm hover:shadow-lg'}`}>
              <item.icon className="mb-6 opacity-20 mx-auto text-current" size={40} />
              <p className="text-[10px] font-black uppercase opacity-50 mb-2 tracking-widest text-current">{item.label}</p>
              <p className="text-4xl font-black tracking-tighter text-current">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6">
           <button onClick={() => scrollToSection('dashboard')} className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${mode === 'EMERGENCY' ? 'bg-red-600 text-white shadow-xl shadow-red-600/30' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'}`}>Главный экран</button>
           <button onClick={() => scrollToSection('scenario')} className={`px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm border-2 border-current opacity-60 hover:opacity-100 transition-all text-current`}>Сценарий ЧС сель</button>
        </div>
      </section>

      {/* MANAGEMENT CONTOUR */}
      <section className={`py-24 ${mode === 'EMERGENCY' ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
        <div className="max-w-[1600px] mx-auto px-6 text-center text-current">
          <h2 className="text-2xl font-black uppercase tracking-[0.4em] mb-16 opacity-40">Управленческий контур СЦ</h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto mb-12">
            {managementSteps.map((s, i) => (
              <React.Fragment key={i}>
                <button onClick={() => setActiveStep(i)} className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl border-4 transition-all ${activeStep === i ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-2xl shadow-indigo-600/40' : (mode === 'EMERGENCY' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-400 hover:text-slate-900')}`}>{i + 1}</button>
                {i < 4 && <div className={`hidden md:block flex-1 h-1.5 rounded-full ${activeStep > i ? 'bg-indigo-50' : 'bg-slate-300 dark:bg-slate-700'}`}></div>}
              </React.Fragment>
            ))}
          </div>
          <div className={`max-w-4xl mx-auto p-12 rounded-[50px] border text-left transition-all duration-500 ${mode === 'EMERGENCY' ? 'bg-slate-950 border-slate-800 shadow-2xl text-current' : 'bg-white border-slate-200 shadow-2xl text-current'}`}>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-10 flex items-center gap-6"><span className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl">{activeStep + 1}</span> {managementSteps[activeStep].title}</h3>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="space-y-3"><p className="text-[10px] font-black uppercase opacity-40 tracking-widest text-current">Источники данных</p><p className="text-sm font-bold leading-relaxed text-current">{managementSteps[activeStep].data}</p></div>
              <div className="space-y-3"><p className="text-[10px] font-black uppercase opacity-40 tracking-widest text-current">KPI / Индикаторы</p><p className="text-sm font-bold leading-relaxed text-current">{managementSteps[activeStep].kpi}</p></div>
              <div className="space-y-3"><p className="text-[10px] font-black uppercase opacity-40 tracking-widest text-current">Результат на дашборде</p><p className="text-sm font-black text-indigo-500 leading-relaxed uppercase text-current">{managementSteps[activeStep].result}</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD CORE */}
      <main id="dashboard" className="max-w-[1600px] mx-auto p-6 grid lg:grid-cols-12 gap-6 text-current">
        <aside className="lg:col-span-3 space-y-6">
          <div className={`p-8 rounded-[40px] border ${mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-50"><Filter size={14}/> Фильтрация</div>
            <div className="space-y-10">
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 mb-4 block tracking-widest">Временной охват</label>
                <div className="grid grid-cols-5 gap-1">
                  {[ { v: 1, l: '24ч' }, { v: 7, l: '7д' }, { v: 30, l: '30д' }, { v: 90, l: '90д' }, { v: 365, l: 'Год' } ].map(p => (
                    <button key={p.v} onClick={() => setFilterPeriod(p.v)} className={`py-4 rounded-xl text-[10px] font-black border transition-all ${filterPeriod === p.v ? 'bg-indigo-600 text-white shadow-lg' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'}`}>{p.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 mb-4 block tracking-widest">Территориальный узел</label>
                <select value={filterMun} onChange={(e) => setFilterMun(e.target.value)} className={`w-full bg-transparent border rounded-2xl p-5 text-sm font-black outline-none transition-all ${mode === 'EMERGENCY' ? 'border-slate-800 text-white bg-slate-900' : 'border-slate-200 text-slate-900 bg-white shadow-inner'}`}>
                  <option className="text-black bg-white">Вся губерния</option>
                  {MUNICIPALITIES.map(m => <option key={m.id} value={m.name} className="text-black bg-white">{m.name}</option>)}
                </select>
              </div>
              <div className="pt-6 border-t border-current opacity-20 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest">Только ключевые KPI</span>
                <button onClick={() => setShowKeyOnly(!showKeyOnly)} className={`w-14 h-7 rounded-full relative transition-all ${showKeyOnly ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${showKeyOnly ? 'translate-x-8' : 'translate-x-1'}`}></div></button>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-6 text-current">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {kpisToShow.map(kpi => (
              <KpiCard key={kpi.id} kpi={kpi} filterMun={filterMun} mode={mode} triggers={triggers} filterPeriod={filterPeriod} onClick={() => setSelectedKpi(kpi)} />
            ))}
          </div>

          {/* ALERTS & TASKS */}
          <div className={`rounded-[50px] border overflow-hidden ${mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-950/50 text-current text-current">
              <button onClick={() => setActiveTab('alerts')} className={`flex-1 py-7 text-[11px] font-black uppercase tracking-[0.3em] border-b-2 transition-all ${activeTab === 'alerts' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent opacity-40 hover:opacity-100'}`}>Лента алертов ({alerts.filter(a => a.status === 'new').length})</button>
              <button onClick={() => setActiveTab('tasks')} className={`flex-1 py-7 text-[11px] font-black uppercase tracking-[0.3em] border-b-2 transition-all ${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-500 bg-indigo-500/5' : 'border-transparent opacity-40 hover:opacity-100'}`}>Поручения ({tasks.length})</button>
            </div>
            <div className="p-10 max-h-[500px] overflow-y-auto custom-scrollbar">
              {activeTab === 'alerts' ? (
                <div className="space-y-6">
                  {alerts.map(a => (
                    <div key={a.id} className={`p-7 rounded-[32px] border flex flex-col sm:flex-row items-center justify-between gap-8 transition-all ${a.level === 'critical' ? 'bg-red-500/10 border-red-500/40' : (mode === 'EMERGENCY' ? 'bg-slate-800/30' : 'bg-slate-50 shadow-inner border-transparent')}`}>
                      <div className="flex items-center gap-8 text-current">
                        <div className={`p-5 rounded-[20px] ${a.level === 'critical' ? 'bg-red-600 shadow-xl' : 'bg-yellow-500 shadow-xl'} text-white`}><AlertTriangle size={28} /></div>
                        <div>
                          <div className="flex items-center gap-4 mb-3">
                             <span className="text-[10px] font-black uppercase tracking-widest">{a.time}</span>
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${a.level === 'critical' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-black'}`}>{a.level}</span>
                          </div>
                          <h4 className={`font-black text-xl uppercase tracking-tighter mb-2 ${mode === 'EMERGENCY' ? 'text-white' : 'text-slate-900'}`}>{a.title}</h4>
                          <p className={`text-xs opacity-70 font-bold uppercase leading-relaxed ${mode === 'EMERGENCY' ? 'text-slate-300' : 'text-slate-600'}`}>{a.desc}</p>
                        </div>
                      </div>
                      <button onClick={() => handleCreateTask(a)} className={`w-full sm:w-auto px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${a.status === 'new' ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'opacity-30 pointer-events-none'}`}>{a.status === 'new' ? 'Принять в работу' : 'В работе'}</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 text-current">
                  {tasks.map(t => (
                    <div key={t.id} className={`p-8 rounded-[40px] border ${mode === 'EMERGENCY' ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-slate-200 shadow-md text-current'}`}>
                        <div className="flex justify-between items-start mb-8 border-b border-current pb-6 opacity-30">
                           <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-current">{t.id}</span><p className="text-xs font-black text-indigo-500 uppercase text-current"><Users size={14} className="inline mr-2"/> {t.responsible}</p></div>
                           <span className="text-[10px] font-black text-red-500 uppercase tracking-widest text-current">Дедлайн: {t.deadline}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black text-2xl uppercase tracking-tighter text-current">{t.title}</h4>
                            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${t.status === 'done' ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>{t.status}</div>
                        </div>
                        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                          {t.checklist.map((item, idx) => (
                            <button key={idx} onClick={() => toggleTaskCheck(t.id, idx)} className={`p-4 rounded-2xl border flex items-center gap-3 text-[11px] font-bold uppercase transition-all ${item.completed ? 'bg-green-500/10 border-green-500/40 text-green-500' : (mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-500 shadow-sm')}`}>
                                {item.completed ? <CheckSquare size={18}/> : <Square size={18}/>} {item.text}
                            </button>
                          ))}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FUZZY CONTROL & RECOVERY Wizard */}
      <section id="scenario" className={`py-32 ${mode === 'EMERGENCY' ? 'bg-red-950/10 border-y border-red-900/20' : 'bg-white'}`}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center text-current text-current">
            <div className="space-y-10 text-current text-current">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-none text-current text-current">Алгоритм нечеткого вывода ЧС</h2>
              
              <div className={`p-10 rounded-[50px] border-4 transition-all duration-700 ${fuzzyS >= 0.5 ? 'border-red-600 bg-red-600/5 shadow-[0_0_50px_rgba(220,38,38,0.2)]' : 'border-slate-200 bg-slate-50 dark:bg-slate-900'}`}>
                <div className="grid grid-cols-3 gap-10 mb-12">
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase opacity-40 uppercase tracking-widest text-current">R (Осадки), мм/ч</p>
                    <input type="range" min="0" max="30" step="0.1" value={triggers.precip} onChange={(e) => setTriggers({...triggers, precip: parseFloat(e.target.value)})} className="w-full accent-indigo-600" />
                    <p className="text-5xl font-black tracking-tighter text-current">{triggers.precip}</p>
                  </div>
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase opacity-40 uppercase tracking-widest text-current">H (Уровень), м</p>
                    <input type="range" min="0" max="2.5" step="0.01" value={triggers.water} onChange={(e) => setTriggers({...triggers, water: parseFloat(e.target.value)})} className="w-full accent-indigo-600" />
                    <p className="text-5xl font-black tracking-tighter text-current">{triggers.water}</p>
                  </div>
                  <div className="space-y-4 text-center text-current text-current">
                    <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">B (Койки), %</p>
                    <input type="range" min="0" max="100" step="1" value={triggers.beds} onChange={(e) => setTriggers({...triggers, beds: parseFloat(e.target.value)})} className="w-full accent-indigo-600" />
                    <p className="text-5xl font-black tracking-tighter text-current">{triggers.beds}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-10 border-t border-current opacity-20 text-current text-current">
                   <div className="flex items-center gap-4 text-current text-current text-current"><ShieldAlert size={40} className={fuzzyS >= 0.5 ? 'text-red-600' : 'text-indigo-600'}/><div className="leading-none text-[10px] font-black uppercase opacity-50 tracking-widest text-current">Расчетная уверенность <br/> ввода ЧП (S)</div></div>
                   <div className={`text-7xl font-black text-current ${fuzzyS >= 0.5 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>{fuzzyS.toFixed(2)}</div>
                </div>
              </div>

              {(mode === 'EMERGENCY' || emState === 'STABILIZATION' || emState === 'RECOVERY') && (
                <div className={`p-10 rounded-[50px] border-4 ${emState === 'STABILIZATION' ? 'border-green-500 bg-green-500/5' : emState === 'RECOVERY' ? 'border-indigo-400 bg-indigo-500/5' : 'border-indigo-500/30 bg-indigo-500/5'} transition-all text-current animate-in fade-in slide-in-from-bottom-4 duration-700`}>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
                        <div><h3 className="text-2xl font-black uppercase tracking-tighter text-current">Консоль восстановления</h3><p className="text-[10px] font-bold uppercase opacity-50 tracking-widest text-current">Автоматический алгоритм деэскалации</p></div>
                        <div className="flex items-center gap-4 text-current text-current text-current"><div className="text-right"><p className="text-[9px] font-black uppercase opacity-40 text-current">Прогресс</p><p className="text-xl font-black text-indigo-500">{Math.round((Object.values(recoveryWizard).filter(v => v).length / 4) * 100)}%</p></div><div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner text-current"><div className="h-full bg-indigo-500 transition-all duration-500 text-current" style={{ width: `${(Object.values(recoveryWizard).filter(v => v).length / 4) * 100}%` }}></div></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={stabilizeWeather} disabled={recoveryWizard.weather} className={`p-4 rounded-3xl border-2 text-left transition-all ${recoveryWizard.weather ? 'bg-green-500 border-green-500 text-white' : (mode === 'EMERGENCY' || emState === 'STABILIZATION' || emState === 'RECOVERY') ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-indigo-500 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-30 grayscale'}`}><Wind size={20} className="mb-2" /><h4 className="text-[9px] font-black uppercase">Метео</h4></button>
                        <button onClick={stabilizeInfra} disabled={!recoveryWizard.weather || recoveryWizard.infra} className={`p-4 rounded-3xl border-2 text-left transition-all ${recoveryWizard.infra ? 'bg-green-500 border-green-500 text-white' : (recoveryWizard.weather) ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-indigo-500 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-30 grayscale'}`}><Hammer size={20} className="mb-2" /><h4 className="text-[9px] font-black uppercase">Инфра</h4></button>
                        <button onClick={stabilizeResources} disabled={!recoveryWizard.infra || recoveryWizard.resources} className={`p-4 rounded-3xl border-2 text-left transition-all ${recoveryWizard.resources ? 'bg-green-500 border-green-500 text-white' : (recoveryWizard.infra) ? 'bg-slate-900 border-slate-700 text-slate-100 hover:border-indigo-500 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-30 grayscale'}`}><Stethoscope size={20} className="mb-2" /><h4 className="text-[9px] font-black uppercase">Медицина</h4></button>
                        <button onClick={finishRecovery} disabled={!recoveryWizard.resources} className={`p-4 rounded-3xl border-2 text-left transition-all ${recoveryWizard.resources ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse shadow-lg' : 'bg-slate-100 border-slate-200 text-slate-400 opacity-30 grayscale'}`}><Play size={20} className="mb-2" /><h4 className="text-[9px] font-black uppercase">Выход</h4></button>
                    </div>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setTriggers({precip: 18, water: 2.1, beds: 95})} className="flex-1 py-5 bg-red-600 text-white font-black uppercase rounded-2xl shadow-xl shadow-red-600/30 tracking-widest hover:scale-[1.02] transition-all">Симуляция Селя</button>
                <button onClick={() => {setTriggers({precip: 2, water: 0.2, beds: 65}); setRecoveryWizard({ weather: false, infra: false, resources: false });}} className="px-10 py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl shadow-slate-900/30 transition-all hover:rotate-180 duration-500 text-current text-current"><RefreshCw size={20}/></button>
              </div>
            </div>
            
            <div className="aspect-video bg-slate-200 dark:bg-slate-950 rounded-[80px] border-[16px] border-white dark:border-slate-900 shadow-2xl relative overflow-hidden group text-current">
              {hoveredMun && (
                <div className="absolute top-10 left-10 z-20 pointer-events-none animate-in fade-in zoom-in duration-300">
                  <div className="bg-slate-950/95 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl text-white min-w-[280px]">
                    <h5 className="text-3xl font-black uppercase mb-6 text-indigo-400 leading-none">{hoveredMun.name}</h5>
                    <div className="space-y-4 text-[11px] font-black uppercase tracking-widest">
                      <div className="flex justify-between"><span>Население:</span><span className="text-slate-300">{hoveredMun.population}</span></div>
                      <div className="flex justify-between"><span>Множитель:</span><span className="text-indigo-400">x{hoveredMun.multiplier}</span></div>
                      <div className="flex justify-between pt-4 border-t border-white/5 text-current text-current"><span>Статус:</span><span className={hoveredMun.dangerZone && mode === 'EMERGENCY' ? 'text-red-500 animate-pulse' : 'text-green-500'}>{hoveredMun.dangerZone && mode === 'EMERGENCY' ? 'Зона поражения' : 'Стабильно'}</span></div>
                    </div>
                  </div>
                </div>
              )}
              <svg viewBox="0 0 400 300" className="w-full h-full p-16 transition-transform duration-1000 group-hover:scale-105">
                {MUNICIPALITIES.map((m) => (
                  <path key={m.id} d={m.path} onMouseEnter={() => setHoveredMun(m)} onMouseLeave={() => setHoveredMun(null)} onClick={() => {setFilterMun(m.name); scrollToSection('dashboard');}} className={`transition-all duration-500 cursor-pointer ${filterMun === m.name ? 'fill-indigo-600/60 stroke-indigo-400' : (mode === 'EMERGENCY' && m.dangerZone ? 'fill-red-600/50 stroke-red-500 animate-pulse' : (mode === 'EMERGENCY' ? 'fill-slate-800' : 'fill-slate-400/10'))} stroke-2 stroke-slate-500/30 hover:fill-indigo-500/20`} />
                ))}
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* STATE MACHINE STAGES */}
      <section className="py-24 max-w-[1600px] mx-auto px-6 text-current text-current text-current">
        <h3 className="text-3xl font-black uppercase mb-16 tracking-tighter text-center text-current text-current">Алгоритм снятия ЧС и восстановления</h3>
        <div className="grid lg:grid-cols-6 gap-4 text-current text-current text-current">
          {[
            { id: 'NORMAL', l: 'ШТАТ', c: 'Все показатели < Warn', s: 'A' },
            { id: 'WATCH', l: 'НАБЛЮДЕНИЕ', c: 'H > 0.5м', s: 'B' },
            { id: 'WARNING', l: 'ГОТОВНОСТЬ', c: 'H > 1.1м', s: 'C' },
            { id: 'EMERGENCY', l: 'ЧС СЕЛЬ', c: 'S >= 0.50 (Fuzzy)', s: 'D' },
            { id: 'STABILIZATION', l: 'СТАБИЛИЗАЦИЯ', c: 'R <= 3, H <= 0.3', s: 'E' },
            { id: 'RECOVERY', l: 'ВОССТАНОВЛЕНИЕ', c: 'R < 3 (6ч)', s: 'F' }
          ].map((state) => (
            <div key={state.id} className={`p-8 rounded-[40px] border-2 transition-all duration-500 text-center ${emState === state.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl scale-105 z-10' : (mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800 text-slate-300 opacity-60' : 'bg-slate-100 border-transparent opacity-40')}`}>
               <div className="text-[10px] font-black uppercase mb-4 opacity-50 tracking-widest text-current">Этап {state.s}</div>
               <h4 className="text-sm font-black mb-6 uppercase tracking-tighter text-current">{state.l}</h4>
               <p className="text-[9px] font-bold uppercase opacity-80 leading-relaxed text-current">{state.c}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA PASSPORT */}
      <section className="py-24 max-w-[1600px] mx-auto px-6 text-current text-current">
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-12 text-center leading-none text-current">Паспорт данных</h3>
        <div className={`border rounded-[50px] overflow-hidden ${mode === 'EMERGENCY' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl text-current text-current'}`}>
           <div className="overflow-x-auto text-current"><table className="w-full text-left text-[11px] font-bold uppercase text-current">
                <thead className={`border-b tracking-[0.2em] ${mode === 'EMERGENCY' ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}><tr><th className="px-10 py-7 text-current">KPI</th><th className="px-10 py-7 text-current">Источник / Система</th><th className="px-10 py-7 text-current">Владелец</th><th className="px-10 py-7 text-current">Обновление</th><th className="px-10 py-7 text-current">Порог (Warn / Crit)</th></tr></thead>
                <tbody className={`divide-y ${mode === 'EMERGENCY' ? 'divide-slate-800' : 'divide-slate-100'} text-current`}>{KPI_METADATA.map(k => (<tr key={k.id} className="hover:bg-indigo-500/5 transition-colors text-current text-current"><td className="px-10 py-6 font-black tracking-tighter text-current text-current">{k.name}</td><td className="px-10 py-6 opacity-60 text-current">{k.request_name}</td><td className="px-10 py-6 font-black text-indigo-500 uppercase text-current">{k.source}</td><td className="px-10 py-6 opacity-40 tracking-widest text-current">{k.freq}</td><td className="px-10 py-6 font-mono opacity-80 tracking-tighter text-current">{k.warning[0]} {k.unit} / {k.critical[0]} {k.unit}</td></tr>))}</tbody>
             </table></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={`py-32 border-t ${mode === 'EMERGENCY' ? 'bg-slate-950 border-red-900/30 text-white' : 'bg-slate-900 text-white shadow-2xl'}`}>
        <div className="max-w-[1600px] mx-auto px-6 grid lg:grid-cols-4 gap-8 text-current text-current text-current text-current">
           <div className="col-span-2 space-y-8"><h3 className="text-4xl font-black uppercase tracking-tighter leading-none text-current text-current">Архитектура IPAS v2.5</h3><p className="text-lg opacity-60 font-bold uppercase tracking-widest text-current text-current">Интегрированная платформа анализа данных. <br/> Потоковая обработка событий и нечеткая аналитика рисков.</p></div>
           {[ { t: 'Источники', d: 'Сквозная интеграция с ведомственными ГИС и 420 IoT датчиками.' }, { t: 'Rules Engine', d: 'Расчет 12 KPI и нечеткий вывод ЧС на базе 27 правил в реальном времени.' } ].map((a, i) => (
             <div key={i} className="p-8 rounded-[40px] border border-white/10 bg-white/5 space-y-4 text-current text-current text-current text-current">
                <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest text-current">{a.t}</h4><p className="text-[10px] opacity-60 leading-relaxed font-bold uppercase text-current text-current">{a.d}</p>
             </div>))}
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      {selectedKpi && <KpiDrawer kpi={selectedKpi} filterMun={filterMun} mode={mode} filterPeriod={filterPeriod} triggers={triggers} onClose={() => setSelectedKpi(null)} />}
      {modals.brief && <BriefModal filterPeriod={filterPeriod} filterMun={filterMun} mode={mode} kpiMeta={KPI_METADATA} getKpiValProp={(k) => getScaledKpiValue(k, filterMun, mode, triggers, filterPeriod)} onClose={() => setModals({...modals, brief: false})} />}
      {modals.resources && <ResourcesModal mode={mode} onClose={() => setModals({...modals, resources: false})} />}

    </div>
  );
}

// --- СУБ-КОМПОНЕНТЫ ---

function KpiDrawer({ kpi, filterMun, mode, filterPeriod, triggers, onClose }) {
  const val = getScaledKpiValue(kpi, filterMun, mode, triggers, filterPeriod);
  const warnLimit = getScaledThreshold(kpi, kpi.warning[0], filterPeriod, filterMun);
  const critLimit = getScaledThreshold(kpi, kpi.critical[0], filterPeriod, filterMun);
  const historyData = useMemo(() => generateScaledHistory(filterPeriod, kpi, filterMun, mode, triggers), [filterPeriod, kpi.id, filterMun, mode, triggers]);
  const recommendation = useMemo(() => {
    const isBad = kpi.id === 'reject_wine' || kpi.id === 'precip' || kpi.id === 'water_lvl' ? val > warnLimit : val < warnLimit;
    const isCrit = kpi.id === 'reject_wine' || kpi.id === 'precip' || kpi.id === 'water_lvl' ? val > critLimit : val < critLimit;
    if (mode === 'EMERGENCY') return 'КРИТИЧЕСКАЯ ФАЗА РЕАГИРОВАНИЯ. ДЕЙСТВОВАТЬ СОГЛАСНО РЕГЛАМЕНТУ ЧС №45-С.';
    if (isCrit) return 'КРИТИЧЕСКОЕ ОТКЛОНЕНИЕ! СРОЧНО СОЗВАТЬ КОМИССИЮ ДЛЯ АУДИТА.';
    return isBad ? 'ВНИМАНИЕ: ВЫХОД ЗА ГРАНИЦУ НОРМЫ.' : 'ПОКАЗАТЕЛЬ В НОРМЕ.';
  }, [val, warnLimit, critLimit, mode, kpi.id]);

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col ${mode === 'EMERGENCY' ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
        <div className="p-12 flex-1 overflow-y-auto custom-scrollbar text-current">
          <div className="flex justify-between items-start mb-12 text-current text-current">
            <div><h2 className="text-5xl font-black uppercase tracking-tighter mb-2 leading-none text-current text-current text-current">{kpi.name}</h2><span className="text-xs font-black opacity-40 uppercase tracking-[0.3em] text-current text-current text-current">{kpi.category} | {kpi.source}</span></div>
            <button onClick={onClose} className={`p-5 rounded-3xl font-black transition-all ${mode === 'EMERGENCY' ? 'bg-slate-800 hover:bg-red-600' : 'bg-slate-100 hover:bg-slate-200'}`}>X</button>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-12 text-current text-current text-current">
            <div className={`p-10 rounded-[50px] border ${mode === 'EMERGENCY' ? 'bg-slate-950 border-slate-800 shadow-2xl' : 'bg-slate-50'}`}><p className="text-[10px] font-black uppercase opacity-40 mb-3 text-current text-current">Фактическое значение</p><p className="text-6xl font-black tracking-tighter text-current text-current text-current text-current">{val.toLocaleString('ru-RU')} <span className="text-lg text-current">{kpi.unit}</span></p></div>
            <div className={`p-10 rounded-[50px] border border-indigo-500/20 ${mode === 'EMERGENCY' ? 'bg-indigo-950/20' : 'bg-indigo-50'}`}><p className="text-[10px] font-black uppercase mb-3 opacity-40 text-current text-current text-current text-current">Порог нормы (Warn)</p><p className="text-4xl font-black text-indigo-500 uppercase text-current text-current text-current">{warnLimit.toLocaleString('ru-RU')}</p></div>
          </div>
          <div className="h-72 border rounded-[50px] p-8 bg-white shadow-2xl mb-12 relative overflow-hidden"><ResponsiveContainer width="100%" height="100%"><AreaChart data={historyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={6} isAnimationActive={false} /><ReferenceLine y={warnLimit} stroke="#f59e0b" strokeDasharray="8 8" label={{ position: 'right', value: 'WARN', fill: '#f59e0b', fontSize: 11, fontWeight: '900' }} /></AreaChart></ResponsiveContainer></div>
          <div className="space-y-8 text-current text-current text-current text-current">
            <div className={`p-10 rounded-[50px] border ${mode === 'EMERGENCY' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><h4 className="text-[11px] font-black uppercase mb-6 opacity-40 flex items-center gap-3 text-current text-current text-current"><Info size={16}/> Описание и методика</h4><p className="text-sm font-bold uppercase leading-relaxed text-current text-current text-current">{kpi.desc}</p><div className="mt-8 pt-8 border-t border-current opacity-20 text-current text-current text-current text-current"><code className="text-[11px] font-mono font-black text-current text-current text-current">{kpi.request_name}</code></div></div>
            <div className={`p-10 rounded-[50px] border-4 ${mode === 'EMERGENCY' ? 'bg-red-950/30 border-red-900/50' : 'bg-indigo-50 border-indigo-100'}`}><h4 className="text-[11px] font-black uppercase mb-6 opacity-40 flex items-center gap-3 text-current text-current text-current"><Eye size={16}/> Решение СЦ</h4><p className="text-xl font-black uppercase leading-tight text-current text-current text-current text-current text-current">{recommendation}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefModal({ filterPeriod, filterMun, mode, kpiMeta, getKpiValProp, onClose }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 text-current text-current text-current">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose}></div>
      <div className={`relative w-full max-w-3xl p-16 rounded-[70px] shadow-2xl border-4 ${mode === 'EMERGENCY' ? 'bg-slate-900 border-red-600 text-slate-100' : 'bg-white border-slate-900 text-slate-900'}`}>
        <h2 className="text-5xl font-black uppercase mb-12 text-current text-current text-current text-current text-current text-current">Оперативная сводка <br/> по сектору {filterMun}</h2>
        <div className="space-y-10 text-current text-current text-current text-current text-current">
          <div className={`p-10 rounded-[50px] ${mode === 'EMERGENCY' ? 'bg-slate-800 shadow-2xl' : 'bg-slate-100 shadow-inner'}`}><p className="text-[11px] font-black uppercase opacity-50 mb-6 text-current text-current text-current">Статус системы за {filterPeriod}д</p><p className="font-black text-3xl uppercase leading-none text-current text-current text-current text-current text-current">{mode === 'EMERGENCY' ? 'АКТИВНАЯ ФАЗА ЛИКВИДАЦИИ ЧС' : 'НОРМАЛЬНОЕ ФУНКЦИОНИРОВАНИЕ'}</p></div>
          <div className="space-y-6 text-current text-current text-current text-current text-current">
             <h4 className="text-[11px] font-black uppercase opacity-40 text-center text-current text-current text-current">Фактические показатели ключевых KPI:</h4>
             {[ { l: 'Дорожная сеть', id: 'water_lvl' }, { l: 'Эко-фон', id: 'eco' }, { l: 'Бюджет', id: 'budget' } ].map((s, i) => {
               const kpi = kpiMeta.find(k => k.id === s.id);
               const val = getKpiValProp(kpi);
               return ( <div key={i} className="flex justify-between items-center py-6 border-b border-current opacity-80 font-black uppercase text-sm text-current text-current text-current text-current text-current text-current"><span className="opacity-60 text-current text-current text-current text-current text-current">{s.l}</span><span className={mode === 'EMERGENCY' ? 'text-red-500' : 'text-indigo-600'}>{val.toLocaleString('ru-RU')} {kpi.unit} | {mode === 'EMERGENCY' ? 'ОТКЛОНЕНИЕ' : 'НОРМА'}</span></div> );
             })}
          </div>
          <button onClick={onClose} className="w-full py-8 mt-10 bg-slate-900 dark:bg-indigo-600 text-white font-black uppercase tracking-[0.3em] rounded-[40px] shadow-2xl transition-all hover:scale-[1.02]">Сводку принял</button>
        </div>
      </div>
    </div>
  );
}

function ResourcesModal({ mode, onClose }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 text-current text-current text-current text-current text-current">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={onClose}></div>
      <div className={`relative w-full max-w-3xl p-16 rounded-[70px] shadow-2xl border-4 ${mode === 'EMERGENCY' ? 'bg-slate-900 border-indigo-600 text-slate-100' : 'bg-white border-slate-200 shadow-sm shadow-indigo-600/20'}`}>
        <h2 className="text-5xl font-black uppercase mb-16 text-center text-current text-current text-current text-current text-current text-current">Ресурсная карта</h2>
        <div className="grid grid-cols-3 gap-8 mb-16 text-current text-current text-current text-current text-current text-current">
           {[ { i: Truck, l: 'Техника', v: '24/30' }, { i: HardHat, l: 'Бригады', v: '12/15' }, { i: Stethoscope, l: 'Койки', v: '88%' } ].map((r, i) => (
             <div key={i} className="p-10 rounded-[50px] text-center bg-white/5 border border-current opacity-60 shadow-lg text-current text-current text-current text-current text-current text-current text-current text-current"><r.i size={48} className="mx-auto mb-6 text-indigo-500" /><p className="text-[10px] font-black uppercase mb-3 text-current text-current text-current text-current text-current text-current text-current">{r.l}</p><p className="text-3xl font-black text-current text-current text-current text-current text-current text-current text-current">{r.v}</p></div>
           ))}
        </div>
        <div className="space-y-6 text-center text-current text-current text-current text-current text-current text-current text-current text-current text-current"><h4 className="text-[12px] font-black uppercase opacity-40 text-current text-current text-current text-current text-current text-current">Резерв автономности: 72ч+</h4><div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-green-500 w-[94%] animate-pulse"></div></div></div>
        <button onClick={onClose} className="w-full py-8 mt-16 bg-slate-900 dark:bg-indigo-600 text-white font-black uppercase tracking-[0.3em] rounded-[40px] shadow-2xl">Закрыть</button>
      </div>
    </div>
  );
}

const styles = `
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 20px; }
`;
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}