"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/app-context";

const MENU_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: "📄" },
  { href: "/seguimiento", label: "Seguimiento administrativo", icon: "⏳" },
  { href: "/expedientes", label: "Expedientes", icon: "📁" },
  { href: "/servicios", label: "Servicios", icon: "🛠️" },
  { href: "/reportes-tecnicos", label: "Reportes técnicos", icon: "📋" },
  { href: "/horometros", label: "Horómetros", icon: "⏱️" },
  { href: "/conformidades", label: "Actas / HES", icon: "📑" },
  { href: "/facturacion", label: "Facturación", icon: "🧾" },
  { href: "/pagos", label: "Pagos y cobranzas", icon: "💰" },
  { href: "/calendario", label: "Calendario", icon: "📅" },
  { href: "/historial", label: "Historial", icon: "📜" },
  { href: "/configuracion", label: "Configuración", icon: "⚙️" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notificacion } = useApp();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F2F2F2] text-[#031240]">
      {/* Notificación Flotante */}
      {notificacion && (
        <div className="fixed top-5 right-5 z-50 bg-[#031240] text-white border-l-4 border-[#14B5D9] px-4 py-3 rounded shadow-lg text-sm flex items-center gap-3 animate-fade-in">
          <span>🔔</span>
          <span className="font-medium">{notificacion}</span>
        </div>
      )}

      {/* Menú Lateral (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-40 w-64 bg-[#031240] text-white flex flex-col transition-transform duration-200 ease-in-out ${
          menuAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logotipo y Header */}
        <div className="p-5 border-b border-[#051A59] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-tr from-[#18A2D9] to-[#14B5D9] flex items-center justify-center font-bold text-lg text-white shadow-sm">
              I
            </div>
            <div>
              <span className="font-bold tracking-wider text-base block text-white">
                INDUSTRAC
              </span>
              <span className="text-[10px] text-[#14B5D9] tracking-widest uppercase block -mt-1 font-semibold">
                S.A.C.
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMenuAbierto(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Lista de Módulos */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {MENU_ITEMS.map((item) => {
            const activo = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuAbierto(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  activo
                    ? "bg-[#051A59] text-[#14B5D9] font-semibold border-l-4 border-[#18A2D9]"
                    : "text-gray-300 hover:bg-[#051A59]/60 hover:text-white"
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del Menú */}
        <div className="p-3 border-t border-[#051A59] text-[11px] text-gray-400">
          <div className="flex items-center justify-between mb-1">
            <span>Compresores Industriales</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-[10px] text-gray-500">v1.0 • Sistema Operativo</div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              className="md:hidden p-2 rounded text-[#031240] hover:bg-gray-100"
            >
              ☰
            </button>
            <span className="font-semibold text-sm md:text-base text-[#031240] hidden sm:inline">
              Gestión Administrativa
            </span>
          </div>

          {/* Buscador General */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente, cotización, expediente o serie..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-[#F2F2F2] border border-gray-200 rounded px-3 py-1.5 pl-8 text-xs text-[#031240] focus:outline-none focus:border-[#18A2D9]"
              />
              <span className="absolute left-2.5 top-1.5 text-xs text-gray-400">🔍</span>
            </div>
          </div>

          {/* Notificaciones y Usuario */}
          <div className="flex items-center gap-4">
            <button
              title="Notificaciones operativas"
              className="relative p-1.5 text-gray-600 hover:text-[#031240]"
            >
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#18A2D9] rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-[#051A59] text-white flex items-center justify-center font-bold text-xs">
                AD
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold leading-tight text-[#031240]">
                  Administración
                </div>
                <div className="text-[10px] text-gray-500">INDUSTRAC S.A.C.</div>
              </div>
            </div>
          </div>
        </header>

        {/* Vista Hija */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Overlay mobile */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}
    </div>
  );
}
