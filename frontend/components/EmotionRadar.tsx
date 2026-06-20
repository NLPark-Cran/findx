"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

const DIMS_ZH = ["愤怒", "讽刺", "恐惧", "厌恶", "喜悦", "悲伤", "惊讶", "轻蔑"];
const DIMS_EN = ["Anger", "Sarcasm", "Fear", "Disgust", "Joy", "Sadness", "Surprise", "Contempt"];

interface EmotionRadarProps {
  emotion: Record<string, number>;
  language?: string;
  className?: string;
}

export function EmotionRadar({ emotion, language = "zh", className }: EmotionRadarProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const dims = language === "zh" ? DIMS_ZH : DIMS_EN;
  const keys = ["anger", "sarcasm", "fear", "disgust", "joy", "sadness", "surprise", "contempt"];
  const values = keys.map((k) => emotion?.[k] ?? 0);

  useEffect(() => {
    if (!chartRef.current) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const isDark = document.documentElement.classList.contains("dark");
    const color = isDark ? "#c9a04c" : "#b8976b";
    const axisColor = isDark ? "rgba(245,240,230,0.25)" : "rgba(0,0,0,0.15)";
    const textColor = isDark ? "#a8b0c0" : "#6b665e";

    chartInstance.current.setOption({
      radar: {
        indicator: dims.map((d) => ({ name: d, max: 1 })),
        radius: "65%",
        axisName: { color: textColor, fontSize: 11 },
        splitArea: {
          areaStyle: {
            color: [isDark ? "rgba(201,160,76,0.05)" : "rgba(184,151,107,0.04)", isDark ? "rgba(201,160,76,0.1)" : "rgba(184,151,107,0.08)"],
          },
        },
        axisLine: { lineStyle: { color: axisColor } },
        splitLine: { lineStyle: { color: axisColor } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: values,
              name: language === "zh" ? "情绪画像" : "Emotion Profile",
              areaStyle: { color: isDark ? "rgba(201,160,76,0.35)" : "rgba(184,151,107,0.25)" },
              lineStyle: { color, width: 2 },
              itemStyle: { color },
            },
          ],
        },
      ],
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [emotion, language]);

  return <div ref={chartRef} className={className || "h-72 w-full"} />;
}
