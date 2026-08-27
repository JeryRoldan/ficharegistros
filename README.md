# Panel privado de fichas de personal

Panel administrativo para consultar por separado los registros de INRE e InformaPerú, descargar el archivo compatible con Excel y revisar los PDF adjuntos.

## Inicio en PowerShell

```powershell
$env:ADMIN_PASSWORD="coloca-una-clave-segura"
$env:DATA_ROOT="C:\ruta\al\proyecto\registros"
node server.js
```

Abrir `http://localhost:8001`. El usuario es `admin`.

`DATA_ROOT` debe apuntar a la carpeta `registros` creada por los formularios. Los datos personales y documentos nunca deben subirse a GitHub.

