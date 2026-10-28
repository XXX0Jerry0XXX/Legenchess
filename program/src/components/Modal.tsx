import type { ReactNode } from 'react';

export function Modal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
