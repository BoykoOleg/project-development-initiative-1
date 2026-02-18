import Icon from "@/components/ui/icon";
import { WorkOrder, statusConfig, getTotal } from "./types";

interface WorkOrderCardProps {
  wo: WorkOrder;
  onClick: () => void;
}

const WorkOrderCard = ({ wo, onClick }: WorkOrderCardProps) => (
  <div
    className="bg-white rounded-xl border border-border shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-bold text-blue-600">{wo.number}</span>
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[wo.status]?.className}`}>
        {statusConfig[wo.status]?.label}
      </span>
    </div>
    <div className="text-sm font-medium text-foreground mb-1">{wo.client}</div>
    <div className="text-sm text-muted-foreground mb-3">{wo.car}</div>
    <div className="flex items-center justify-between pt-3 border-t border-border">
      <div className="text-xs text-muted-foreground">
        {wo.master ? (
          <span className="flex items-center gap-1"><Icon name="User" size={12} />{wo.master}</span>
        ) : (
          <span className="text-amber-500">Мастер не назначен</span>
        )}
      </div>
      <div className="text-sm font-bold text-foreground">{getTotal(wo).toLocaleString("ru-RU")} ₽</div>
    </div>
    <div className="text-xs text-muted-foreground mt-2">
      {wo.works.length} работ, {wo.parts.length} запчастей
    </div>
  </div>
);

export default WorkOrderCard;
