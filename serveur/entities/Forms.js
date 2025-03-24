const { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } = require("typeorm");
const Component = require("./Component");
const Response = require("./Response");

@Entity({ name: "forms" }) // Nom de la table en minuscule
class Form {
  @PrimaryColumn({ type: "varchar", length: 50 })
  id;

  @Column({ type: "varchar", length: 255 })
  title;

  @Column({ type: "json", nullable: true })
  json_data;

  @CreateDateColumn({ type: "timestamp" })
  created_at;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at;

  @OneToMany(() => Component, (component) => component.form)
  components;

  @OneToMany(() => Response, (response) => response.form)
  responses;
}

module.exports = Form;
