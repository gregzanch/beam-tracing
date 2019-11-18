// export function uniformSampleHemisphere(r1: number, r2: number){
//     // cos(theta) = r1 = y
//     // cos^2(theta) + sin^2(theta) = 1 -> sin(theta) = srtf(1 - cos^2(theta))
//     const sinTheta = Math.sqrt(1 - r1**2);
//     const phi = 2 * Math.PI * r2;
//     const x = sinTheta * Math.cos(phi);
//     const z = sinTheta * Math.sin(phi);
//     return Vec3f(x, u1, z);
// } 
 

// std:: default_random_engine generator;
// std:: uniform_real_distribution < float > distribution(0, 1);

// uint32_t N = 16;

// for (uint32_t n = 0; n < N; ++i) {
    // float r1 = distribution(generator);
    // float r2 = distribution(generator);
    // Vec3f sample = uniformSampleHemisphere(r1, r2); 
    // ...
// } 