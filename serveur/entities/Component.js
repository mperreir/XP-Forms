const { Entity, PrimaryColumn, Column, ManyToOne } = require("typeorm");
const Form = require("./Forms");

@Entity({ name: "components" }) // Nom de la table en minuscule
class Component {
  @PrimaryColumn({ type: "varchar", length: 50 })
  id;

  @ManyToOne(() => Form, (form) => form.components, { onDelete: "CASCADE" })
  form;

  @Column({ type: "varchar", length: 255 })
  label;

  @Column({ type: "varchar", length: 50 })
  type;

  @Column({ type: "varchar", length: 10, nullable: true })
  action;

  @Column({ type: "varchar", length: 255, nullable: true })
  key_name;

  @Column({ type: "json", nullable: true })
  layout;
}

module.exports = Component;
