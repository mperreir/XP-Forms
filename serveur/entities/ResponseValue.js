const { Entity, PrimaryGeneratedColumn, Column, ManyToOne } = require("typeorm");
const Response = require("./Response");
const Component = require("./Component");

@Entity({ name: "response_values" }) // Nom de la table en minuscule
class ResponseValue {
  @PrimaryGeneratedColumn()
  id;

  @ManyToOne(() => Response, (response) => response.response_values, { onDelete: "CASCADE" })
  response;

  @ManyToOne(() => Component, { onDelete: "CASCADE" })
  component;

  @Column({ type: "text" })
  value;
}

module.exports = ResponseValue;
