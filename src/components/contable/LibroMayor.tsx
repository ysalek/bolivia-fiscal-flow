import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpenCheck, Calendar, Filter, Download, Search } from 'lucide-react';
import { useAsientos } from '@/hooks/useAsientos';
import { AsientoContable } from './diary/DiaryData';

interface MovimientoCuenta {
  fecha: string;
  numeroAsiento: string;
  concepto: string;
  referencia: string;
  debe: number;
  haber: number;
  saldo: number;
}

interface CuentaMayor {
  codigo: string;
  nombre: string;
  movimientos: MovimientoCuenta[];
  saldoInicial: number;
  saldoFinal: number;
  totalDebe: number;
  totalHaber: number;
}

const LibroMayor = () => {
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10));
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string>('');
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [cuentasMayor, setCuentasMayor] = useState<CuentaMayor[]>([]);
  const [cuentasDisponibles, setCuentasDisponibles] = useState<{codigo: string, nombre: string}[]>([]);
  
  const { getAsientos } = useAsientos();

  useEffect(() => {
    generarLibroMayor();
  }, [fechaInicio, fechaFin]);

  const generarLibroMayor = () => {
    const asientos = getAsientos();
    
    // Filtrar asientos por fecha
    const asientosFiltrados = asientos.filter(asiento => {
      const fechaAsiento = new Date(asiento.fecha);
      const fechaInicioObj = new Date(fechaInicio);
      const fechaFinObj = new Date(fechaFin);
      return fechaAsiento >= fechaInicioObj && fechaAsiento <= fechaFinObj && asiento.estado === 'registrado';
    });

    // Agrupar por cuenta
    const cuentasMap = new Map<string, MovimientoCuenta[]>();
    const cuentasInfo = new Map<string, string>();

    asientosFiltrados.forEach(asiento => {
      asiento.cuentas.forEach(cuenta => {
        const key = cuenta.codigo;
        cuentasInfo.set(key, cuenta.nombre);
        
        if (!cuentasMap.has(key)) {
          cuentasMap.set(key, []);
        }

        const movimiento: MovimientoCuenta = {
          fecha: asiento.fecha,
          numeroAsiento: asiento.numero,
          concepto: asiento.concepto,
          referencia: asiento.referencia,
          debe: cuenta.debe,
          haber: cuenta.haber,
          saldo: 0 // Se calculará después
        };

        cuentasMap.get(key)!.push(movimiento);
      });
    });

    // Crear cuentas mayor con saldos calculados
    const cuentasMayorData: CuentaMayor[] = [];
    
    cuentasMap.forEach((movimientos, codigo) => {
      // Ordenar movimientos por fecha
      movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      
      let saldoAcumulado = 0;
      let totalDebe = 0;
      let totalHaber = 0;

      // Calcular saldos acumulados
      const movimientosConSaldo = movimientos.map(movimiento => {
        saldoAcumulado += movimiento.debe - movimiento.haber;
        totalDebe += movimiento.debe;
        totalHaber += movimiento.haber;
        
        return {
          ...movimiento,
          saldo: saldoAcumulado
        };
      });

      const cuentaMayor: CuentaMayor = {
        codigo,
        nombre: cuentasInfo.get(codigo) || 'Cuenta Desconocida',
        movimientos: movimientosConSaldo,
        saldoInicial: 0,
        saldoFinal: saldoAcumulado,
        totalDebe,
        totalHaber
      };

      cuentasMayorData.push(cuentaMayor);
    });

    // Ordenar por código de cuenta
    cuentasMayorData.sort((a, b) => a.codigo.localeCompare(b.codigo));
    
    setCuentasMayor(cuentasMayorData);
    
    // Actualizar lista de cuentas disponibles
    const cuentasUnicas = cuentasMayorData.map(cuenta => ({
      codigo: cuenta.codigo,
      nombre: cuenta.nombre
    }));
    setCuentasDisponibles(cuentasUnicas);
  };

  const filtrarCuentas = () => {
    let cuentasFiltradas = cuentasMayor;

    if (cuentaSeleccionada) {
      cuentasFiltradas = cuentasFiltradas.filter(cuenta => cuenta.codigo === cuentaSeleccionada);
    }

    if (busquedaCuenta) {
      cuentasFiltradas = cuentasFiltradas.filter(cuenta => 
        cuenta.codigo.toLowerCase().includes(busquedaCuenta.toLowerCase()) ||
        cuenta.nombre.toLowerCase().includes(busquedaCuenta.toLowerCase())
      );
    }

    return cuentasFiltradas;
  };

  const exportarLibroMayor = () => {
    const cuentasFiltradas = filtrarCuentas();
    
    let contenido = `LIBRO MAYOR\nPeríodo: ${fechaInicio} al ${fechaFin}\n\n`;
    
    cuentasFiltradas.forEach(cuenta => {
      contenido += `CUENTA: ${cuenta.codigo} - ${cuenta.nombre}\n`;
      contenido += `Saldo Final: ${cuenta.saldoFinal.toFixed(2)} Bs.\n`;
      contenido += `Total Debe: ${cuenta.totalDebe.toFixed(2)} Bs. | Total Haber: ${cuenta.totalHaber.toFixed(2)} Bs.\n\n`;
      
      contenido += `Fecha\tAsiento\tConcepto\tDebe\tHaber\tSaldo\n`;
      cuenta.movimientos.forEach(mov => {
        contenido += `${mov.fecha}\t${mov.numeroAsiento}\t${mov.concepto}\t${mov.debe.toFixed(2)}\t${mov.haber.toFixed(2)}\t${mov.saldo.toFixed(2)}\n`;
      });
      
      contenido += `\n${'='.repeat(80)}\n\n`;
    });

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `libro_mayor_${fechaInicio}_${fechaFin}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cuentasFiltradas = filtrarCuentas();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6" />
            Libro Mayor - Normativa Boliviana
          </CardTitle>
          <CardDescription>
            Registro detallado de movimientos por cuenta contable según normativa del CTNAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <div className="flex flex-col gap-1">
                <Label htmlFor="fecha-inicio">Desde:</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="fecha-fin">Hasta:</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <div className="flex flex-col gap-1">
                <Label>Buscar Cuenta:</Label>
                <Input
                  placeholder="Código o nombre..."
                  value={busquedaCuenta}
                  onChange={(e) => setBusquedaCuenta(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <div className="flex flex-col gap-1">
                <Label>Cuenta Específica:</Label>
                <Select value={cuentaSeleccionada} onValueChange={setCuentaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las cuentas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las cuentas</SelectItem>
                    {cuentasDisponibles.map(cuenta => (
                      <SelectItem key={cuenta.codigo} value={cuenta.codigo}>
                        {cuenta.codigo} - {cuenta.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botón de exportar */}
          <div className="flex justify-end mb-4">
            <Button onClick={exportarLibroMayor} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Libro Mayor
            </Button>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {cuentasFiltradas.length}
                </div>
                <div className="text-sm text-muted-foreground">Cuentas con Movimiento</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  Bs. {cuentasFiltradas.reduce((sum, cuenta) => sum + cuenta.totalDebe, 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Débitos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  Bs. {cuentasFiltradas.reduce((sum, cuenta) => sum + cuenta.totalHaber, 0).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Créditos</div>
              </CardContent>
            </Card>
          </div>

          {/* Cuentas Mayor */}
          <div className="space-y-6">
            {cuentasFiltradas.map(cuenta => (
              <Card key={cuenta.codigo} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {cuenta.codigo} - {cuenta.nombre}
                      </CardTitle>
                      <CardDescription>
                        {cuenta.movimientos.length} movimientos registrados
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        Bs. {cuenta.saldoFinal.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Saldo Final</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <Badge variant="outline" className="text-green-600">
                      Debe: Bs. {cuenta.totalDebe.toFixed(2)}
                    </Badge>
                    <Badge variant="outline" className="text-red-600">
                      Haber: Bs. {cuenta.totalHaber.toFixed(2)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>N° Asiento</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead className="text-right">Debe (Bs.)</TableHead>
                        <TableHead className="text-right">Haber (Bs.)</TableHead>
                        <TableHead className="text-right">Saldo (Bs.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cuenta.movimientos.map((movimiento, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(movimiento.fecha).toLocaleDateString('es-BO')}</TableCell>
                          <TableCell className="font-mono">{movimiento.numeroAsiento}</TableCell>
                          <TableCell>{movimiento.concepto}</TableCell>
                          <TableCell>{movimiento.referencia}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {movimiento.debe > 0 ? movimiento.debe.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {movimiento.haber > 0 ? movimiento.haber.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {movimiento.saldo.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>

          {cuentasFiltradas.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpenCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Sin movimientos contables</h3>
                <p className="text-muted-foreground">
                  No se encontraron movimientos contables en el período seleccionado.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LibroMayor;