import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Database } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export const AuthDebugInfo = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const checkSupabaseSession = async () => {
    setLoading(true);
    try {
      // Verificar sesión de Supabase directamente
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      setSupabaseUser(sbUser);
      
      // Contar productos del usuario
      if (sbUser) {
        const { count } = await supabase
          .from('productos')
          .select('*', { count: 'exact', head: true });
        setProductCount(count || 0);
      } else {
        setProductCount(0);
      }
    } catch (error) {
      console.error('Error verificando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSupabaseSession();
  }, []);

  const handleReLogin = async () => {
    setLoading(true);
    try {
      // Logout y login automático
      await logout();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔑 Relogin automático...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ysalek@gmail.com',
        password: '123456'
      });
      
      if (error) {
        console.error('❌ Error en relogin:', error);
      } else {
        console.log('✅ Relogin exitoso');
        setTimeout(() => checkSupabaseSession(), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4" />
          Estado de Autenticación - Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Context:</strong>
            <div className="mt-1">
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? "Autenticado" : "No autenticado"}
              </Badge>
              {user && (
                <div className="text-xs mt-1 text-muted-foreground">
                  Email: {user.email}<br />
                  Nombre: {user.nombre}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <strong>Supabase Session:</strong>
            <div className="mt-1">
              <Badge variant={supabaseUser ? "default" : "destructive"}>
                {supabaseUser ? "Conectado" : "Desconectado"}
              </Badge>
              {supabaseUser && (
                <div className="text-xs mt-1 text-muted-foreground">
                  ID: {supabaseUser.id.slice(0, 8)}...<br />
                  Email: {supabaseUser.email}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Productos accesibles: {productCount}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={checkSupabaseSession}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Verificar
              </Button>
              <Button 
                size="sm" 
                onClick={handleReLogin}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {loading ? 'Conectando...' : '🔄 Re-Login'}
              </Button>
            </div>
          </div>
        </div>

        {productCount === 0 && supabaseUser && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            ⚠️ Usuario conectado pero sin productos. Los productos pueden estar asociados a otro usuario.
          </div>
        )}
      </CardContent>
    </Card>
  );
};