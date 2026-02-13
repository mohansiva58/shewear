import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely in love with my purchases! The quality is exceptional and the fit is perfect. She Wear has become my go-to for all special occasions.',
    avatar: 'P',
  },
  {
    name: 'Ananya Gupta',
    location: 'Delhi',
    rating: 5,
    text: 'The dresses are stunning and exactly as shown in the pictures. Fast delivery and beautiful packaging. Highly recommend!',
    avatar: 'A',
  },
  {
    name: 'Sneha Patel',
    location: 'Bangalore',
    rating: 5,
    text: "Found my wedding reception outfit here! The customer service was incredible and they helped me choose the perfect dress. Thank you She Wear!",
    avatar: 'S',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-2">
            What Our Customers Say
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
            Love Letters
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -6 }}
              className="bg-secondary rounded-2xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 text-primary/20" size={40} />
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} size={16} className="fill-gold text-gold" />
                ))}
              </div>
              
              <p className="text-foreground/80 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
