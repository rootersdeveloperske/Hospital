import React from 'react'

export default function Sidebar({ role }: { role: string }) {
  const menus: Record<string, string[]> = {
    ADMIN: ['Dashboard', 'Users', 'Medicines', 'Reports'],
    DOCTOR: ['My Patients', 'Consultations'],
    RECEPTIONIST: ['Token', 'Patients'],
    PHARMACIST: ['Dispense', 'Inventory']
  }

  const items = menus[role] || []

  return (
    <aside className="w-64 p-4 border-r">
      <h3 className="font-bold mb-4">Menu</h3>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it} className="text-sm">
            {it}
          </li>
        ))}
      </ul>
    </aside>
  )
}
