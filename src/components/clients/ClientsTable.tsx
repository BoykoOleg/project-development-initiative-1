import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Client } from "./ClientTypes";

const ResizeHandle = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
  <div
    className="absolute right-0 top-0 h-full w-2 cursor-col-resize flex items-center justify-center group/handle select-none"
    onMouseDown={onMouseDown}
  >
    <div className="w-px h-4 bg-border group-hover/handle:bg-blue-400 transition-colors" />
  </div>
);

interface Props {
  clients: Client[];
  filtered: Client[];
  loading: boolean;
  colWidths: number[];
  onColMouseDown: (i: number) => (e: React.MouseEvent) => void;
  onSelectClient: (client: Client) => void;
  onOpenCreate: () => void;
}

const ClientsTable = ({ clients, filtered, loading, colWidths, onColMouseDown, onSelectClient, onOpenCreate }: Props) => {
  if (loading) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Users" size={28} className="text-blue-500" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">Клиентов пока нет</h3>
        <p className="text-sm text-muted-foreground mb-4">Добавьте первого клиента, чтобы начать работу</p>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onOpenCreate}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          Добавить клиента
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="table-fixed w-full">
          <colgroup>
            {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              {["Клиент", "Телефон", "Автомобили", "Комментарий"].map((label, i) => (
                <th
                  key={i}
                  className={`text-left text-xs font-medium text-muted-foreground px-4 py-2 relative overflow-hidden${i === 1 ? " hidden md:table-cell" : ""}${i === 2 ? " hidden lg:table-cell" : ""}${i === 3 ? " hidden xl:table-cell" : ""}`}
                >
                  <span className="block truncate">{label}</span>
                  {i < 3 && <ResizeHandle onMouseDown={onColMouseDown(i)} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr
                key={client.id}
                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onSelectClient(client)}
              >
                <td className="px-4 py-2 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-600">
                        {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{client.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden truncate">{client.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-foreground hidden md:table-cell overflow-hidden truncate">{client.phone || "—"}</td>
                <td className="px-4 py-2 hidden lg:table-cell overflow-hidden">
                  {client.cars.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Icon name="Car" size={13} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{client.cars[0].brand} {client.cars[0].model}{client.cars[0].year ? ` ${client.cars[0].year}` : ""}</span>
                      {client.cars.length > 1 && <span className="text-xs text-muted-foreground shrink-0">+{client.cars.length - 1}</span>}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-sm text-muted-foreground hidden xl:table-cell overflow-hidden truncate">
                  {client.comment || "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Клиенты не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTable;
