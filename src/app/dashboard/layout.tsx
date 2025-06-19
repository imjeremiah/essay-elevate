/**
 * @file This is the layout for the protected dashboard area.
 * It will likely include a sidebar, header, and other elements
 * that are common across all dashboard pages.
 */
import React from 'react';

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* Include a sidebar or header here */}
      <main>{children}</main>
    </section>
  );
}

export default DashboardLayout; 