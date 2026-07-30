package br.com.maissustentavel.api.impacto.repository;

import java.math.BigDecimal;

/**
 * Projeção da série mensal: ano e mês da coleta e a soma de litros reais do mês
 * (no período). A competência "YYYY-MM" e o valor social (R$) são derivados no serviço.
 */
public interface MensalAgregado {

    int getAno();

    int getMes();

    BigDecimal getLitros();
}
