# syntax=docker/dockerfile:1

### Estágio de build — compila e empacota o jar.
### (Java vive só no Docker, nunca no host — ver constitution.md Art. 1.6)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
# Baixa dependências primeiro para aproveitar o cache de camadas.
COPY pom.xml ./
RUN mvn -B -q dependency:go-offline
COPY src/ ./src/
RUN mvn -B -q -DskipTests clean package

### Estágio de runtime — imagem enxuta apenas com JRE.
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
# Usuário não-root (baseline de segurança, Art. 7).
RUN groupadd --system spring && useradd --system --gid spring spring
COPY --from=build /app/target/*.jar app.jar
USER spring:spring
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]