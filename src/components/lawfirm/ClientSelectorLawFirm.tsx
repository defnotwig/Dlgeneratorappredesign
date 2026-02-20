import { useState, useMemo } from 'react';
import { Building2, Search } from 'lucide-react';

interface ClientSelectorProps {
  selectedClient: string;
  setSelectedClient: (client: string) => void;
}

const clients = [
  { id: 'bpi', name: 'BPI', fullName: 'Bank of the Philippine Islands' },
  { id: 'bpi-banko', name: 'BPI BANKO', fullName: 'BPI Direct BanKo' },
  { id: 'eon-bank', name: 'EON BANK', fullName: 'EON Bank' },
  { id: 'usb-plc', name: 'USB PLC', fullName: 'Union Bank of the Philippines' },
  { id: 'citibank', name: 'Citibank', fullName: 'Citibank N.A.' },
  { id: 'hsbc', name: 'HSBC', fullName: 'HSBC Philippines' },
];

export function ClientSelectorLawFirm({ selectedClient, setSelectedClient }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="bg-white rounded shadow-sm border border-stone-200 p-6">
      <div className="mb-4">
        <h3 className="font-serif font-bold text-lg text-stone-900">Client Selection</h3>
        <p className="text-sm text-stone-600 mt-1">Select the client folder for each tracking</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-600"
        />
      </div>

      {/* Client List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredClients.length === 0 ? (
          <p className="text-center text-stone-500 py-4">No clients found</p>
        ) : (
          filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`w-full p-3 rounded border-2 transition-all text-left ${
                selectedClient === client.id
                  ? 'border-amber-700 bg-amber-50'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={20} className={selectedClient === client.id ? 'text-amber-700' : 'text-stone-600'} />
                <div className="flex-1">
                  <h4 className={`font-semibold ${selectedClient === client.id ? 'text-amber-900' : 'text-stone-900'}`}>
                    {client.name}
                  </h4>
                  <p className={`text-xs ${selectedClient === client.id ? 'text-amber-800' : 'text-stone-600'}`}>
                    {client.fullName}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}