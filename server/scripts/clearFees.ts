import prisma from '../src/config/database';

async function clearFees() {
  try {
    console.log('🗑️  Eliminando todos los pagos...');
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✅ ${deletedPayments.count} pagos eliminados`);

    console.log('🗑️  Eliminando todas las cuotas...');
    const deletedFees = await prisma.fee.deleteMany({});
    console.log(`✅ ${deletedFees.count} cuotas eliminadas`);

    console.log('✨ Base de datos de cuotas limpiada exitosamente');
  } catch (error) {
    console.error('❌ Error al limpiar cuotas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearFees()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
