-- Limpar histórico de análises e máquinas
DELETE FROM recommendations;
DELETE FROM emissions;
DELETE FROM analyses;
DELETE FROM machines;

-- Resetar auto_increment
ALTER TABLE recommendations AUTO_INCREMENT = 1;
ALTER TABLE emissions AUTO_INCREMENT = 1;
ALTER TABLE analyses AUTO_INCREMENT = 1;
ALTER TABLE machines AUTO_INCREMENT = 1;

-- Resetar métricas dos usuários
UPDATE user_metrics SET totalAnalyses = 0, totalMachines = 0, totalEmissionKgCO2 = 0;
