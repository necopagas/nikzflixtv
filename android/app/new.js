javascript
        import { CapacitorHttp } from '@capacitor/http';

        const getVivamaxMovies = async () => {
          const options = {
            url: 'https://api.example.com/vivamax/movies', // Ilisi sa tinuod nga API URL
            headers: { 'Content-Type': 'application/json' }
          };

          try {
            const response = await CapacitorHttp.get(options);
            // Ang data naa sa response.data
            console.log(response.data);
            return response.data;
          } catch (error) {
            console.error('Error pagkuha sa movies:', error);
          }
        };
        