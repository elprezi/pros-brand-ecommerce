import React from 'react';
import type { ActivityEvent } from '../../../lib/admin/analytics/dashboard';

interface ActivityFeedWidgetProps {
  activities: ActivityEvent[];
}

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({ activities }) => {
  return (
    <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
      <div className="pb-3 border-b border-neutral-200">
        <span className="text-[10px] font-bold text-pros-gold uppercase tracking-wider block">JOURNAL D’AUDIT</span>
        <h3 className="font-display font-bold text-sm uppercase text-pros-black tracking-wider">
          ACTIVITÉ RÉCENTE DE LA PLATEFORME
        </h3>
      </div>

      <div className="space-y-3 text-xs font-sans">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 font-sans bg-pros-bone border border-neutral-200 p-4">
            Aucune activité récente.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex items-center justify-between p-3 bg-pros-bone border border-neutral-200 font-sans transition-colors hover:border-neutral-300"
            >
              <div className="text-black font-sans">{act.text}</div>
              <div className="text-[10px] text-neutral-500 shrink-0 ml-4 font-sans font-bold">
                {act.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
