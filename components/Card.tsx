interface CardProps {
  title: string
  description: string
  color: string
  icon: string
}

export default function Card({ title, description, color, icon }: CardProps) {
  return (
    <div 
      className="p-8 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300"
      style={{ backgroundColor: color }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-white/90 leading-relaxed">{description}</p>
    </div>
  )
}