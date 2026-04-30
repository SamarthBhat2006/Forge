import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Pill } from '../components/ui/Pill';

export default function DevTokens() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-display-lg mb-10">Design System Tokens</h1>
      
      <div className="grid gap-8">
        {/* Card Component */}
        <section>
          <h2 className="text-h2 mb-4">Card</h2>
          <Card>
            <h3 className="text-h3 mb-2">Card Title</h3>
            <p className="text-body text-secondary">
              Cards use the bg-surface variable, have a border radius of xl (18px), and implement the subtle card-gradient with inner borders.
            </p>
          </Card>
        </section>

        {/* Buttons Component */}
        <section>
          <h2 className="text-h2 mb-4">Buttons</h2>
          <Card className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
          </Card>
        </section>

        {/* Input Component */}
        <section>
          <h2 className="text-h2 mb-4">Input</h2>
          <Card>
            <label className="block text-label text-secondary mb-2 uppercase tracking-wide">
              Sample Input Label
            </label>
            <Input placeholder="Type something..." type="text" />
            <p className="text-caption text-tertiary mt-2">
              This is a helper text to show caption typography.
            </p>
          </Card>
        </section>

        {/* Pills Component */}
        <section>
          <h2 className="text-h2 mb-4">Status Pills</h2>
          <Card className="flex gap-4 items-center bg-surface-inset">
            <Pill variant="success">+ 95.0%</Pill>
            <Pill variant="danger">- Absent</Pill>
            <span className="text-micro bg-surface-raised text-secondary rounded-full px-2 py-1 uppercase tracking-wider ml-4">
              Metadata Tag
            </span>
          </Card>
        </section>
      </div>
    </div>
  );
}
