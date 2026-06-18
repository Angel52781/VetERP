import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const demoEmail = process.env.VETERP_DEMO_EMAIL ?? "admin@veterp.com";
const demoPassword = process.env.VETERP_DEMO_PASSWORD ?? "password123";
const demoClinicaName = process.env.VETERP_DEMO_CLINICA ?? "Clinica Demo";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

function normalize(message = "") {
  return message.toLowerCase();
}

async function ensureSession() {
  const signIn = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (!signIn.error && signIn.data.session) {
    return signIn.data.session.user.id;
  }

  const signInMessage = normalize(signIn.error?.message);
  const shouldTrySignup =
    signInMessage.includes("invalid login credentials") ||
    signInMessage.includes("invalid credentials");

  if (!shouldTrySignup) {
    throw new Error(`No se pudo iniciar sesion: ${signIn.error?.message ?? "error desconocido"}`);
  }

  const signUp = await supabase.auth.signUp({
    email: demoEmail,
    password: demoPassword,
  });

  if (signUp.error) {
    const signupMessage = normalize(signUp.error.message);
    const alreadyRegistered =
      signupMessage.includes("already registered") ||
      signupMessage.includes("already been registered");

    if (!alreadyRegistered) {
      throw new Error(`No se pudo registrar usuario demo: ${signUp.error.message}`);
    }
  }

  const signInAgain = await supabase.auth.signInWithPassword({
    email: demoEmail,
    password: demoPassword,
  });

  if (!signInAgain.error && signInAgain.data.session) {
    return signInAgain.data.session.user.id;
  }

  const signInAgainMessage = normalize(signInAgain.error?.message);
  if (signInAgainMessage.includes("email not confirmed")) {
    throw new Error(
      "La cuenta demo existe pero no esta confirmada. Desactiva confirmacion de email en Supabase Auth o confirma el correo.",
    );
  }

  throw new Error(
    `No se pudo obtener sesion para el usuario demo: ${signInAgain.error?.message ?? "error desconocido"}`,
  );
}

async function ensureClinica(userId) {
  const membershipsResult = await supabase
    .from("user_clinicas")
    .select("clinica_id, role")
    .eq("user_id", userId);

  if (membershipsResult.error) {
    throw new Error(`No se pudo consultar membresias: ${membershipsResult.error.message}`);
  }

  if (membershipsResult.data.length > 0) {
    return membershipsResult.data[0].clinica_id;
  }

  const createClinica = await supabase.rpc("create_clinica", {
    p_nombre: demoClinicaName,
  });

  if (createClinica.error || !createClinica.data) {
    throw new Error(`No se pudo crear clinica demo: ${createClinica.error?.message ?? "sin id de clinica"}`);
  }

  return createClinica.data;
}

async function upsertById(table, rows) {
  const result = await supabase.from(table).upsert(rows, { onConflict: "id" });
  if (result.error) {
    throw new Error(`Error en ${table}: ${result.error.message}`);
  }
}

async function ensureBaseData(clinicaId) {
  const almacenId = "33333333-3333-3333-3333-333333333333";
  const proveedorId = "44444444-4444-4444-4444-444444444444";

  const itemConsultaId = "55555555-5555-5555-5555-555555555551";
  const itemVacunaId = "55555555-5555-5555-5555-555555555552";
  const itemDesparasitanteId = "55555555-5555-5555-5555-555555555553";

  await upsertById("almacenes", [
    {
      id: almacenId,
      clinica_id: clinicaId,
      nombre: "Almacen Principal",
      is_default: true,
    },
  ]);

  await upsertById("proveedores", [
    {
      id: proveedorId,
      clinica_id: clinicaId,
      nombre: "Proveedor Demo",
      contacto: "Juan Perez",
      telefono: "555-1234",
    },
  ]);

  await upsertById("items_catalogo", [
    {
      id: itemConsultaId,
      clinica_id: clinicaId,
      nombre: "Consulta General",
      descripcion: "Consulta general de rutina",
      kind: "servicio",
      precio_inc: 50,
      proveedor_id: null,
    },
    {
      id: itemVacunaId,
      clinica_id: clinicaId,
      nombre: "Vacuna Antirrabica",
      descripcion: "Vacuna anual",
      kind: "producto",
      precio_inc: 25,
      proveedor_id: proveedorId,
    },
    {
      id: itemDesparasitanteId,
      clinica_id: clinicaId,
      nombre: "Desparasitante Interno",
      descripcion: "Pastilla desparasitante",
      kind: "producto",
      precio_inc: 15,
      proveedor_id: proveedorId,
    },
  ]);

  const initialStock = await supabase
    .from("movimientos_stock")
    .select("id")
    .eq("clinica_id", clinicaId)
    .eq("notas", "Inventario inicial")
    .limit(1);

  if (initialStock.error) {
    throw new Error(`No se pudo consultar stock inicial: ${initialStock.error.message}`);
  }

  if (!initialStock.data.length) {
    const insertStock = await supabase.from("movimientos_stock").insert([
      {
        clinica_id: clinicaId,
        item_id: itemVacunaId,
        almacen_id: almacenId,
        qty: 100,
        tipo: "entrada",
        notas: "Inventario inicial",
      },
      {
        clinica_id: clinicaId,
        item_id: itemDesparasitanteId,
        almacen_id: almacenId,
        qty: 200,
        tipo: "entrada",
        notas: "Inventario inicial",
      },
    ]);

    if (insertStock.error) {
      throw new Error(`No se pudo insertar stock inicial: ${insertStock.error.message}`);
    }
  }
}

async function main() {
  console.log("Bootstrapping demo user en Supabase...");
  const userId = await ensureSession();
  const clinicaId = await ensureClinica(userId);
  await ensureBaseData(clinicaId);

  console.log("OK: bootstrap completado.");
  console.log(`Usuario demo: ${demoEmail}`);
  console.log(`Contrasena demo: ${demoPassword}`);
  console.log(`Clinica activa: ${clinicaId}`);
}

main().catch((error) => {
  console.error("Fallo bootstrap:", error.message);
  process.exit(1);
});
